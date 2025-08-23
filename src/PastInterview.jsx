import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth, SignedOut, SignInButton } from "@clerk/clerk-react";
import { db } from "./firebaseConfig";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

function PastInterview() {
  const location = useLocation();
  const passed = location.state?.feedbacks || [];
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Fallback: if user refreshed this page, location.state is empty.
  const [fetched, setFetched] = useState([]);
  useEffect(() => {
    const run = async () => {
      if (isLoaded && isSignedIn && userId && passed.length === 0) {
        const q = query(
          collection(db, "Feedback"),
          where("userId", "==", userId),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        setFetched(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    };
    run();
  }, [isLoaded, isSignedIn, userId, passed.length]);

  const feedbacks = useMemo(
    () => (passed.length ? passed : fetched),
    [passed, fetched]
  );

  if (!isLoaded) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <SignedOut>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm text-blue-900">
          <p className="mb-4 font-semibold">Please sign in to view your past interviews.</p>
          <SignInButton />
        </div>
      </SignedOut>

      {isSignedIn && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your Past Interviews
          </h2>

          {feedbacks.length === 0 ? (
            <div className="text-gray-500">No interviews found.</div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs text-blue-700">
                      {fb.created_at ? new Date(fb.created_at).toLocaleString() : ""}
                    </p>
                  </div>

                  <p className="mt-1 font-semibold text-blue-900">
                    <span className="opacity-70">Question:</span> {fb.question}
                  </p>

                  <p className="mt-2 text-blue-800">
                    <span className="font-medium opacity-80">Answer:</span> {fb.transcript}
                  </p>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-blue-800">
                    <span className="bg-white/60 rounded-lg px-3 py-1">
                      <span className="font-semibold">Correctness:</span>{" "}
                      {fb?.feedback?.correctness ?? "-"} / 5
                    </span>
                    <span className="bg-white/60 rounded-lg px-3 py-1">
                      <span className="font-semibold">Completeness:</span>{" "}
                      {fb?.feedback?.completeness ?? "-"} / 5
                    </span>
                  </div>

                  <p className="mt-3 text-blue-900">
                    <span className="font-semibold opacity-80">Feedback:</span>{" "}
                    {fb?.feedback?.feedback ?? ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PastInterview;




// import { useLocation } from 'react-router-dom';
// import { useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { useAuth, SignedOut, SignInButton } from "@clerk/clerk-react";
// import { db } from "./firebaseConfig";
// import { collection, getDocs, orderBy, query, where } from "firebase/firestore";


// function PastInterview() {
//   const location = useLocation();
//   const { feedbacks } = location.state || { feedbacks: [] };

//   if (!feedbacks.length) {
//     return <div>No past feedback available.</div>;
//   }

//    return (
//     <div className="p-6 space-y-4">
//       <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">Past Interviews</h2>
//       {feedbacks.map((fb) => (
//         <div
//           key={fb.id}
//           className="bg-blue-100 hover:bg-blue-200 transition-colors p-4 rounded-lg shadow"
//         >
//           <p className="font-semibold text-blue-800"><strong>Question:</strong> {fb.question}</p>
//           <p className="mt-2 text-blue-700"><strong>Answer:</strong> {fb.transcript}</p>
//           <div className="mt-2 flex gap-4 text-blue-600">
//             <span><strong>Correctness:</strong> {fb.feedback.correctness}/5</span>
//             <span><strong>Completeness:</strong> {fb.feedback.completeness}/5</span>
//           </div>
//           <p className="mt-2 text-blue-900"><strong>Feedback:</strong> {fb.feedback.feedback}</p>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default PastInterview;