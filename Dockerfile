
FROM python:3.10


WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000

CMD ["python", "server.py"]
