import { useState, useRef, useEffect, useContext } from 'react'
import React from 'react';
import { styled, keyframes } from '@stitches/react';
import { violet, mauve, blackA } from '@radix-ui/colors';
import { MixerHorizontalIcon, Cross2Icon  } from '@radix-ui/react-icons';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { CreateAuthorModalContext } from "../../Context/CreateAuthorModalContext"
import { OpenBooksSideDrawerContext } from '../../Context/OpenBooksSideDrawerContext';

import UserAvator from '../App/Avator';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';

export default function NavBar( props ){
   const { drawerRef ,  setClient} = props
   const { openBooksSideDrawer } = useContext( OpenBooksSideDrawerContext  )


    return(
        <div className="navbar min-h-12  m-0  overflow-hidden">
  <div className="flex-none m-0">
    <button className="btn btn-sm btn-square btn-ghost"
    onClick={()=>{
        drawerRef.current.click()
    }}
    >
      <EllipsisHorizontalIcon />
    </button>
  </div>
  <div className="flex-1">
    <a className="btn btn-sm btn-ghost normal-case">Books Manager</a>
  </div>


  <div class="flex-none gap-2">
        <UserAvator setClient={setClient} />
  </div>


  <div className="flex-none">
    <button className="btn btn-sm btn-square btn-ghost"
    onClick={_=>openBooksSideDrawer.current.click()}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
    </button>
  </div>
</div>
    )


}