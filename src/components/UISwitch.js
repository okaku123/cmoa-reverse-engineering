import { useState } from 'react'
import { Switch } from '@headlessui/react'


export default function UISwitch( props  ) {
  let [enabled, setEnabled] = useState(false)
  const { on , close } = props

  const onChange = () =>{
    enabled = !enabled
    setEnabled( enabled )
    if (enabled){
        on()
    }else{
        close()
    }
    
  }

  return (
    <div className="py-2">
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${enabled ? 'bg-teal-900' : 'bg-teal-700'}
          relative inline-flex h-[16px] w-[30px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`${enabled ? 'translate-x-3' : 'translate-x-0'}
            pointer-events-none inline-block h-[12px] w-[12px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  )
}
