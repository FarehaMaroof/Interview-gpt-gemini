import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Interview from './Interview';           // main interview component


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Interview />} />
        {/* <Route path="/Interviews" element={<Interview />} /> */}
      </Routes>
      </>
   
  );
}

export default App;

