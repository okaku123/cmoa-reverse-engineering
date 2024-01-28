import './App.css';
import {  useRef } from 'react'
import useInsidesideClick from './useInsidesideClick'

function NavBar(props) {
    const {  show } = props
    const ref = useRef()

    useInsidesideClick(ref, () => {
        show()
      });

  return(
      <>
      <div class="bg-indigo-600">
  <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between flex-wrap">
      <div class="w-0 flex-1 flex items-center">
        <p class="ml-3 font-medium text-white truncate">
          <span class="md:hidden"> We announced a new product! </span>
          <span class="hidden md:inline"> Big news! We're excited to announce a brand new product. </span>
        </p>
      </div>
      <div class="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
        <button type="button" class="-mr-1 flex p-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            // ref = {ref}
            onClick={show}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#fafafa" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>

 
        </button>
      </div>
    </div>
  </div>
</div>
      
      </>
    )
}

export default NavBar