from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import redis
import json
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Redis
redis_client = redis.StrictRedis.from_url(os.getenv("REDIS_URL"), decode_responses=True)

# Initialize embedding model
embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# Initialize LLM
llm = ChatGroq(
    temperature=0,
    model_name="llama-3.3-70b-versatile",
)

@app.route("/upload_pdfs", methods=["POST"])
def upload_pdfs():
    """Handles user PDF upload and creates a session."""
    if "session_name" not in request.form:
        return jsonify({"error": "Session name is required"}), 400

    session_name = request.form["session_name"]
    if redis_client.exists(f"session:{session_name}"):
        return jsonify({"error": "Session name already exists. Choose another"}), 400

    # Get uploaded files
    files = request.files.getlist("pdfs")
    
    if not files or len(files) > 3:
        return jsonify({"error": "Upload between 1 and 3 PDFs"}), 400

    pdf_paths = []
    for file in files:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        file.save(filepath)
        pdf_paths.append(filepath)

    # Load and split PDFs
    chunks = load_and_split_pdf(pdf_paths)

    # Store embeddings in PGVector
    db = PGVector(
        collection_name=session_name,
        embeddings=embedding_model,
        connection=os.getenv("DATABASE_URL"),
    )

    for doc in chunks:
        doc.metadata["id"] = str(uuid.uuid4())
        doc.metadata["session_name"] = session_name

    db.add_documents(chunks)

    # Store session in Redis
    session_data = json.dumps({"history": []})
    redis_client.set(f"session:{session_name}", session_data)

    return jsonify({"message": f"Session '{session_name}' created successfully"}), 200


@app.route("/ask", methods=["POST"])
def ask_question():
    """Handles user queries within a session."""
    data = request.json
    session_name = data.get("session_name")
    user_input = data.get("user_input")

    if not session_name or not redis_client.exists(f"session:{session_name}"):
        return jsonify({"error": "Invalid session"}), 400
    if not user_input:
        return jsonify({"error": "Query cannot be empty"}), 400

    # Retrieve session history
    session_data = json.loads(redis_client.get(f"session:{session_name}"))
    history = session_data.get("history", [])

    # Retrieve stored embeddings
    db = PGVector(
        collection_name=session_name,
        embeddings=embedding_model,
        connection=os.getenv("DATABASE_URL"),
    )

    retrieved_docs = db.similarity_search(user_input, k=5)
    context = "\n".join([doc.page_content[:500] for doc in retrieved_docs])  # Limit text size

    SYSTEM_PROMPT = """
    You are an AI named DOCBOT that answers user queries based on uploaded PDFs, and please produce beautiful responses only.
    The Information you generate should be embedded inside html tags only.
    and please don't give in this format too **Cost Reduction** or ```html (for any kind of headings or text),
    Give direct tags which can be used inside body, but not body or html tags.
    Example:
    Don't give this
    <html>
    <body>
        <h1>Hello! I'm DOCBOT</h1>
        <p>I'm here to help answer your questions based on the PDFs you upload. Feel free to ask anything you need assistance with!</p>
    </body>
    </html>
    But give this 
     <h1>Hello! I'm DOCBOT</h1>
        <p>I'm here to help answer your questions based on the PDFs you upload. Feel free to ask anything you need assistance with!</p>
    
    """

    # Construct prompt
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{history}"),
        ("human", "{user_input}"),
    ])

    prompt_value = prompt_template.format(
        history="\n".join(f"{turn['role']}: {turn['content']}" for turn in history),
        user_input=f"Context:\n{context}\n\nUser: {user_input}"
    )

    output_parser = StrOutputParser()
    response = llm.invoke(prompt_value)
    parsed_response = output_parser.parse(response.content)

    history.append({"role": "user", "content": user_input})
    history.append({"role": "ai", "content": parsed_response})

    # Store updated history in Redis (keeping last 10 messages)
    session_data["history"] = history[-10:]
    redis_client.set(f"session:{session_name}", json.dumps(session_data))

    return jsonify({"response": parsed_response}), 200


@app.route("/sessions", methods=["GET"])
def get_sessions():
    """Returns a list of active sessions."""
    keys = redis_client.keys("session:*")
    sessions = [key.split(":")[1] for key in keys]
    return jsonify({"sessions": sessions}), 200


@app.route("/delete_session", methods=["DELETE"])
def delete_session():
    """Deletes a session and clears stored embeddings."""
    session_name = request.args.get("session_name")

    if not redis_client.exists(f"session:{session_name}"):
        return jsonify({"error": "Session not found"}), 404

    # Delete session from Redis
    redis_client.delete(f"session:{session_name}")

    return jsonify({"message": f"Session '{session_name}' deleted"}), 200


def load_and_split_pdf(pdf_paths):
    """Loads and splits PDFs into chunks for embeddings."""
    chunks = []
    for pdf in pdf_paths:
        loader = PyMuPDFLoader(pdf)
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=50)
        temp_chunks = text_splitter.split_documents(docs)
        chunks.extend(temp_chunks)  # Flatten the list
    return chunks


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 3000)), debug=True)

