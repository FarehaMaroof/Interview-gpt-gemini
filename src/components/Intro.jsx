import React from 'react'
import { TbCirclesFilled } from "react-icons/tb";


function Intro() {
  return (
    <>
      <div className="mx-auto w-3xl bg-blue-100 p-1 m-10 rounded-lg shadoow transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-100 cursor pointer">
       <p className='m-15 font-semibold text-blue-600 '>
       Welcome to Interview GPT!
        Prepare for your next programming interview with ease. Interview GPT is your personal AI-powered interview coach that helps you:

     
       <p className='flex gap-2 items-center text-blue-900'><TbCirclesFilled />Practice real interview questions in your chosen programming language.</p> 
       <p className='flex gap-2 items-center text-blue-900'><TbCirclesFilled />Record and analyze your answers using advanced speech recognition.</p>
       <p className='flex gap-2 items-center text-blue-900 '><TbCirclesFilled />Receive instant feedback on correctness, completeness, and areas of improvement.</p>
        
      
Sign in to start your personalized interview practice, track your progress, and access your past interviews anytime.

Get ready to level up your coding interview skills! 
      </p>
      </div>
    </>
  )
}

export default Intro
