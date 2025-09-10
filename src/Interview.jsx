import React, { useState, useRef, useEffect } from 'react';

// This is the single-file React component for the PDF Resume Interview Coach.
// It combines a PDF viewer with an LLM-powered analysis tool.

const App = () => {
    // State variables
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeContent, setResumeContent] = useState('');
    const [userQuestion, setUserQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState('');
    const [isPdfJsReady, setIsPdfJsReady] = useState(false);
    const pdfDisplayRef = useRef(null);
    const pdfjsLibRef = useRef(null); // Ref to hold the loaded pdf.js library

    // Dynamically import the pdf.js library
    useEffect(() => {
        const loadPdfJs = async () => {
            try {
                // Dynamic import of the library and its worker
                const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/+esm');
                pdfjsLibRef.current = pdfjs;
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs';
                setIsPdfJsReady(true);
            } catch (err) {
                console.error("Failed to load PDF library:", err);
                setError('Failed to load PDF library. Please try refreshing the page.');
            }
        };

        loadPdfJs();
    }, []);

    // Function to render a single PDF page
    const renderPage = async (page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page-container w-full aspect-auto rounded-lg shadow-md mb-4 overflow-hidden';
        pageContainer.appendChild(canvas);
        if (pdfDisplayRef.current) {
            pdfDisplayRef.current.appendChild(pageContainer);
        }

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;
    };

    // Handles the file selection and reads the content
    const handleFileChange = async (e) => {
        if (!isPdfJsReady) {
            setError('PDF library is not yet loaded. Please wait a moment and try again.');
            return;
        }

        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            setResumeFile(null);
            setResumeContent('');
            setAiResponse(null);
            if (pdfDisplayRef.current) {
                pdfDisplayRef.current.innerHTML = `<div class="message-box">Select a PDF file to begin the analysis.</div>`;
            }
            return;
        }

        setResumeFile(file);
        setError('');
        setIsLoading(true);
        setIsRendering(true); // Start rendering process
        setAiResponse(null);
        if (pdfDisplayRef.current) {
            pdfDisplayRef.current.innerHTML = `<div class="message-box">Extracting text and rendering PDF...</div>`;
        }

        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            const typedarray = new Uint8Array(event.target.result);
            try {
                const pdfDocument = await pdfjsLibRef.current.getDocument({ data: typedarray }).promise;
                let fullText = '';

                if (pdfDisplayRef.current) {
                    pdfDisplayRef.current.innerHTML = ''; // Clear previous pages
                }

                // Render and extract text from all pages
                for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                    const page = await pdfDocument.getPage(pageNum);
                    await renderPage(page);

                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                setResumeContent(fullText);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF. Please try a different file.');
            } finally {
                setIsLoading(false);
                setIsRendering(false);
            }
        };
        fileReader.readAsArrayBuffer(file);
    };

    // Asks the Gemini model to respond based on the resume
    const getAnswerFromResume = async () => {
        if (!resumeContent) {
            setError('Please upload and process a resume first.');
            return;
        }
        if (!userQuestion.trim()) {
            setError('Please enter a question to get an answer.');
            return;
        }

        setIsLoading(true);
        setAiResponse(null);
        setError('');

        try {
            const systemPrompt = "You are an interview coach and a resume analysis expert. Your task is to provide a concise and professional answer to a question based on the provided resume content. If the question cannot be answered from the resume, state that politely. You must provide a direct answer, without any additional conversational text or explanations. Do not mention personal information, only provide professional analysis.";
            const userQuery = `Here is the resume content:\n---\n${resumeContent}\n---\n\nHere is the question to answer based on the resume:\n"${userQuestion}"`;

            // Pull the API key from the environment variable.
            const apiKey = process.env.REACT_APP_GOOGLE_API_KEY; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            };

            setAiResponse('Thinking...');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                setAiResponse(text);
            } else {
                setAiResponse('Analysis failed. The model did not return a valid response.');
            }

        } catch (err) {
            console.error(err);
            setError('Failed to get a response. Please try again.');
            setAiResponse('An error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans flex flex-col items-center">
            <div className="w-full max-w-6xl bg-white p-8 rounded-xl shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: PDF Viewer */}
                <div className="pdf-container flex flex-col items-center">
                    <h1 className="text-3xl font-bold text-center text-purple-600 mb-2">PDF Resume Viewer</h1>
                    <p className="text-center text-gray-600 mb-6">Upload and view a resume to begin.</p>

                    <div className="mb-6 w-full">
                        <label className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 block text-center">
                            <input type="file" id="pdfFile" accept=".pdf" className="hidden" onChange={handleFileChange} />
                            Select a PDF File
                        </label>
                    </div>

                    <div ref={pdfDisplayRef} className="w-full space-y-6">
                        {!isPdfJsReady && !error && (
                            <div className="message-box text-center">Loading PDF library...</div>
                        )}
                        {isPdfJsReady && !resumeFile && !isLoading && (
                            <div className="message-box">Select a PDF file to begin the analysis.</div>
                        )}
                         {isLoading && (
                            <div className="message-box text-center">Extracting text and rendering PDF...</div>
                        )}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-4 text-center" role="alert">
                                <span className="block">{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Interview Coach */}
                <div className="analysis-container flex flex-col">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Resume Interview Coach</h2>
                    <p className="text-gray-600 mb-6">Ask questions about the resume content.</p>

                    {/* Question Input Section */}
                    <div className="mb-6 flex-grow flex flex-col">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="user-question">
                            Ask a Question
                        </label>
                        <textarea
                            id="user-question"
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                            rows="4"
                            placeholder="e.g., 'What are the candidate's key skills?'"
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center mb-6 mt-auto">
                        <button
                            onClick={getAnswerFromResume}
                            disabled={isLoading || isRendering || !resumeContent || !userQuestion.trim()}
                            className={`w-full py-3 px-8 rounded-full text-white font-bold transition-all duration-300 ${
                                isLoading || isRendering || !resumeContent || !userQuestion.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                            } focus:outline-none focus:ring-4 focus:ring-blue-300`}
                        >
                            {isLoading ? 'Thinking...' : 'Get Answer'}
                        </button>
                    </div>

                    {/* Response and Error Display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-4" role="alert">
                            <span className="block">{error}</span>
                        </div>
                    )}

                    {aiResponse && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-4">
                            <h3 className="text-xl font-semibold text-blue-800 mb-2">AI Response:</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
