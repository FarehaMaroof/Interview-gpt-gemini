import React, { useEffect, useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import logo from "./assets/logo.jpg";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import Intro from "./components/Intro";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Link } from "react-router-dom";
import {
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";

// import { Link } from "react-router-dom";

// import axios from 'axios';

//firebase
// const firebaseUrl ='https://frontend2-afaca-default-rtdb.asia-southeast1.firebasedatabase.app/';

// speech recognition setup
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function Interview() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedbackLoadingStatus, setFeedbackLoadingStatus] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [reAttempt, setReAttempt] = useState(false);
  const [question, setQuestion] = useState(null);
  const [questionStatus, setQuestionStatus] = useState(true);
  const hasFetchedQuestionRef = useRef(false);
  //   let { user } = useUser(null);
  //   let { isSignesIn } = useAuth();
  const [value, setValue] = useState("");
  //  const feedbackSavedRef = useRef(false);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const { isLoaded, isSignedIn, userId } = useAuth();

  const saveFeedback = async ({ question, transcript, feedback }) => {
    try {
      await addDoc(collection(db, "Feedback"), {
        question,
        transcript,
        feedback,
        userId,
        created_at: new Date().toISOString(),
      });
      console.log("Feedback saved!");
    } catch (e) {
      console.error("Error adding feedback: ", e);
    }
  };

  //   const fetchFeedbacks = async () => {
  //     try {
  //       const q = query(
  //         collection(db, "Feedback"),
  //         orderBy("created_at", "desc")
  //       );
  //       const querySnapshot = await getDocs(q);
  //       return querySnapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));
  //     } catch (e) {
  //       console.error("Error fetching feedbacks: ", e);
  //       return [];
  //     }
  //   };

  const fetchFeedbacksForUser = async (uid) => {
    try {
      if (!uid) return [];
      const q = query(
        collection(db, "Feedback"),
        where("userId", "==", uid),
        orderBy("created_at", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error fetching feedbacks: ", e);
      return [];
    }
  };

  useEffect(() => {
    //  if (!hasFetchedQuestionRef.current) {
    //   hasFetchedQuestionRef.current = true;
    //   getQuestion().finally(() => setQuestionStatus(false));
    // }
    if (isLoaded && isSignedIn && userId) {
      fetchFeedbacksForUser(userId).then(setAllFeedbacks);
    }
    //   fetchFeedbacks().then(setAllFeedbacks);
    recognition.onresult = (e) => {
      const current = e.resultIndex;
      const transcript = e.results[current][0].transcript;
      setTranscript(transcript);
    };
    recognition.onend = async () => {
      setIsListening(false);
      if (!question) return; // skip if no question exists
      await getFeedback();
      if (isListening) {
        recognition.start(); // restart if it should still be listening
      }
    };
  }, [isLoaded, isSignedIn, userId]);

  // async function fetchQuestion() {
  //   {
  //     await getQuestion();

  //   }
  //   fetchQuestion();
  // }

  const handleStartListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const handleStopListening = async () => {
    setIsListening(false);
    recognition.stop();

    if (!transcript || transcript.trim().length === 0) {
    setFeedback({
      correctness: 0,
      completeness: 0,
      feedback: "No answer was provided. Please try again.",
    });
    return; // stop here, don’t call Gemini
  }

  // if transcript has content, then get Gemini feedback
  await getFeedback();
};
   
  const handleReAttempt = () => {
    setFeedback(null); //clean the right hand answer
    // to start recording'
    setTranscript("");
    setIsListening(false);
    setReAttempt(true);
    recognition.start();
  };

  // to get new questions

  const getQuestion = async () => {
    setQuestionStatus(true);
    setFeedback(null);
    setTranscript("");
    try {
      console.log("Getting question...");

      const prompt = `
      You are an interview coach. Return only a single new random theoritical ${value} interview question ,some may be about datatypes in java ,some may be about variables,tokens etc,  generate new question everytime - no additional text or explaination.
     
       Question: ${question}
       Answer: ${transcript}
      `;

      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const res = await model.generateContent(prompt);
      const json = JSON.parse(await res.response.text());
      // json now holds your structured question object
      // or appropriate key based on your schema

      setQuestion(json.question);

      setQuestionStatus(false);
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionStatus(false);
    }
  };

  // reading and answering question section
  const getFeedback = async () => {
    setFeedbackLoadingStatus(true);
    try {
      console.log("Analyzing with Gemini...");

      const prompt = `
      You are an interview coach. The answer you'll review comes from speech-to-text transcription. Ignore minor recognition errors and filler words.
Focus on evaluating core meaning.

Question: ${question}
Answer: ${transcript}

Provide your evaluation as a JSON object:
{
  "correctness": <number 0-5> <if the answer is incorrect do give 0><how relevant the answer was>,
  "completeness": <number 0-5> <if the answer is incorrect do give 0><how complete the aanswer was>,
  "feedback": "<detailed feedback in max 150 words><string>"
  
}
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const raw = await result.response.text();

      // Remove markdown code fences if present
      const cleaned = raw.replace(/```json\s*|```/g, "").trim();

      console.log("Cleaned feedback JSON:", cleaned);
      const feedback = JSON.parse(cleaned);
      setFeedback(feedback);

      // Save feedback to Firestore
      await saveFeedback({ question, transcript, feedback });
      //    const parsed = JSON.parse(cleaned);
      // setFeedback(parsed);

      // Save feedback once
      // if (!feedbackSavedRef.current) {
      //   await axios.post(firebaseUrl, {
      //     question,
      //     transcript,
      //     feedback: parsed,
      //     timestamp: new Date().toISOString(),
      //   });
      //   feedbackSavedRef.current = true;
      // }
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackLoadingStatus(false);
    }
  };



  return (
    <>
      <div className="w-full sm:w-full h-20 bg-blue-400 flex gap-2 items-center justify-between p-5 border-b outline-none">
        <div className="m-5 flex justify-start items-center gap-3 max-sm:m-2 max-sm:gap-1 ">
          <img src={logo} alt="Logo" className="rounded-full h-15 w-15 " />
          <p className="font-extrabold max-sm:text-xl text-3xl text-gray-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">Interview GPT</p>
        </div>

        <div className="">
          <div className="m-8 text-white font-bold border-0 rounded-lg px-2 py-2 flex gap-2 
          transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 cursor:pointer">
            <header className="flex gap-2">
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />

                {/* Show Previous Interview button only when signed in */}
                {allFeedbacks.length > 0 && (
                  <Link
                    to="/past-interviews"
                    state={{ feedbacks: allFeedbacks }}
                  >
                    <button className="text-white border-2 border-amber-50 rounded-lg p-2">Previous Interview</button>
                  </Link>
                )}
              </SignedIn>
              
            </header>
            {/* <Link to="/past-interviews">
              <button className="text-white">Previous Interview</button>
            </Link> */}

            {/* <Link to="/past-interviews" state={{ feedbacks: allFeedbacks }}>
  <button className="text-white">Previous Interview</button>
</Link> */}

          
          </div>
        </div>
      </div>

      <SignedIn>
        <div className="w-full h-screen overflow-y-auto    ">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row ">
            {/* <span>@{isSignesIn? user.firstName:""}</span> */}
            {/* Question Container */}

            <div
              className={`transition all${
                feedbackLoadingStatus || feedback
                  ? "w-full sm:w-1/2 h-auto sm:h-screen p-5"
                  : "w-full"
              }`}
            >
              <div className="mt-8 flex gap-2 max-sm:block max-sm:m-5 justify-center items-center align-center border-b border-blue-800">
                <p className=" text-blue-700 ">
                  Enter the Programming Language on which you want to give
                  interview :
                </p>
                <input
                  type="text"
                  placeholder="Enter Language"
                  value={value} // controlled input
                  onChange={(e) => setValue(e.target.value)} // update state
                  className={`w-35 shadow border-2 rounded-lg border-blue-800 outline-none p-1 text-center `}
                />
              </div>
              <h1 className="text-xl mt-14 font-bold">
                {questionStatus ? "loading question..." : question}
              </h1>
              <p className="mt-10 font-semibold">Record your Answer</p>
              <p className="text-sm text-neutral-700 mb-10">
                Try to answer accurately and to the point. The assistant will
                analyze your answer and give results.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={
                    isListening ? handleStopListening : handleStartListening
                  }
                  className={`text-white px-5 py-2 rounded-full ${
                    isListening ? "bg-black" : "bg-blue-600"
                  } ${feedback ? "hidden" : ""}`}
                >
                  {isListening ? "Submit Answer" : "Start Answering"}
                </button>

                <button
                  onClick={handleReAttempt}
                  className={`py-2 px-5  rounded-full ${
                    feedback ? "bg-neutral-100" : ""
                  } `}
                >
                  {feedback ? "Re Attempt Question" : ""}
                </button>

                <button
                  onClick={getQuestion}
                  className={`py-2 px-5 rounded-full  ${
                    isListening ? "hidden" : "bg-black text-white"
                  }`}
                >
                  {isListening ? "Next Question" : "Generate Question"}
                </button>
                <button onClick={getQuestion} disabled={questionStatus}>
                  {questionStatus ? "Loading…" : "Question Generated "}
                </button>
              </div>

              <p className="text-blue-600 mt-8">{transcript}</p>
            </div>
            {/* feedback container */}
            <div
              className={`transition-all ${
                // feedbackLoadingStatus || feedback
                //   ? "w-1/2 border-l h-screen p-5 "
                //   : "w-0"

                 feedbackLoadingStatus || feedback
      ? "w-full sm:w-1/2 border-t sm:border-l h-auto p-5"
      : "hidden"
              }`}
            >
              {feedback && (
                <div className=" mt-24">
                  <p>
                    {feedbackLoadingStatus
                      ? "Lets see how you answered..."
                      : ""}
                  </p>
                  <div className="border p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h1>Correctness</h1>
                      <h1>{feedback.correctness}/5</h1>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => {
                        return (
                          <div
                            key={i}
                            className={`h-1 rounded-full flex-1 ${
                              i < Number(feedback.correctness)
                                ? "bg-blue-600"
                                : "bg-neutral-200"
                            }`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h1>Completeness</h1>
                      <h1>{feedback.completeness}/5</h1>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => {
                        return (
                          <div
                            key={i}
                            className={`h-1 rounded-full flex-1 ${
                              i < Number(feedback.completeness)
                                ? "bg-blue-600"
                                : "bg-neutral-200"
                            }`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                  <p>{feedback.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <Intro />
      </SignedOut>
    </>
  );
}

export default Interview;
