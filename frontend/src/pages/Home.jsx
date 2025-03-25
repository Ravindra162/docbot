import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const Home = () => {
  const [files, setFiles] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      alert('You can only upload up to 3 files.');
      return;
    }
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleCreateSession = async () => {
    if (!sessionName) {
      alert('Session name is required.');
      return;
    }

    if (files.length === 0) {
      alert('Please upload at least one file.');
      return;
    }

    const formData = new FormData();
    formData.append('session_name', sessionName);
    files.forEach((file) => formData.append('pdfs', file));

    try {
      // Set loading state
      setIsLoading(true);

      const response = await fetch('https://docbot-server.onrender.com/upload_pdfs', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log(result);
      if (!response.ok) {
        alert(result.error || 'Failed to create session.');
      } else {
        alert('Session created successfully!');
        setFiles([]);
        localStorage.setItem('docbot_session_name', sessionName);
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('An error occurred while creating the session.');
    } finally {
      // Remove loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#000023] to-[#00005a] flex flex-col items-center justify-center p-6 relative">
      {/* Navbar */}
      <Navbar/>

      {/* Main Content */}
      <div className={`w-full max-w-2xl space-y-8 ${isLoading ? 'opacity-30 pointer-events-none' : ''}`}>
        {/* Upload Files Section */}
        <div className="bg-[#001040] border-2 border-cyan-400 rounded-2xl p-6 shadow-2xl shadow-cyan-500/30 transform transition-all hover:scale-105">
          <div className="flex items-center justify-center mb-6">
            <Upload className="text-cyan-400 mr-4" size={36} />
            <h1 className="text-3xl font-bold text-cyan-300">Upload Files</h1>
          </div>
          <div className="flex items-center justify-center">
            <label className="cursor-pointer flex items-center justify-center w-full bg-[#002060] hover:bg-[#003080] transition-colors rounded-lg p-4 border-2 border-dashed border-cyan-500">
              <PlusCircle className="text-cyan-400 mr-4" size={24} />
              <span className="text-cyan-200">Select PDF Files (Max 3)</span>
              <input
                onChange={handleFileChange}
                type="file"
                className="hidden"
                multiple
                accept=".pdf"
              />
            </label>
          </div>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="bg-[#001040] border-2 border-purple-400 rounded-2xl p-6 shadow-2xl shadow-purple-500/30 transform transition-all hover:scale-105">
            <div className="flex items-center justify-center mb-6">
              <FileText className="text-purple-400 mr-4" size={36} />
              <h2 className="text-3xl font-bold text-purple-300">Uploaded Files</h2>
            </div>
            <ul className="space-y-4">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="bg-[#002060] rounded-lg p-4 flex items-center justify-between hover:bg-[#003080] transition-colors"
                >
                  <span className="text-purple-200 truncate max-w-[70%]">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Session Section */}
        <div className="bg-[#001040] border-2 border-green-400 rounded-2xl p-6 shadow-2xl shadow-green-500/30 transform transition-all hover:scale-105">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-3xl font-bold text-green-300">Create Session</h2>
          </div>
          <div className="space-y-6">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              className="w-full p-4 bg-[#002060] border-2 border-green-500 rounded-lg text-green-200 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleCreateSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Create Session
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#001040] border-2 border-cyan-400 rounded-2xl p-8 shadow-2xl flex items-center space-x-4">
            <Loader2 className="animate-spin text-cyan-400" size={36} />
            <span className="text-2xl text-cyan-300">Creating session for you...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;