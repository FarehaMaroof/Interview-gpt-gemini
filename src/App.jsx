import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Interview from './Interview';           // main interview component
import PastInterview from './PastInterview';   // The component to display past feedbacks

function App() {
  return (
    <>
      
      <Routes>
        <Route path="/" element={<Interview />} />
        <Route path="/past-interviews" element={<PastInterview />} />
      </Routes>
      </>
   
  );
}

export default App;

