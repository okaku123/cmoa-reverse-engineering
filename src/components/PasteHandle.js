import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import UINotify from './UINotify.js'

// window.addEventListener('paste',function(e){
//     if(!(e.clipboardData && e.clipboardData.items)){
//         return
//     }
//     for( var i = 0, len = e.clipboardData.items.length ; i < len ; i++ ){
//         var itemz = e.clipboardData.items[i]
//         if (itemz.kind == "string"){
//             itemz.getAsString(function(str){
//                 alert(str)
//             })
//         }else if (itemz.kind == "file"){
//             var pasteFile = itemz.getAsFile()
//             console.log(pasteFile)
//         }
//     }


// })

export default function PasteHandle(props) {

  const [isOpen, setIsOpen] = useState(false)
  const [isNotify, setIsNotify] = useState(false)
  const [content, setContent] = useState('https://katfile.com/ehlsxrbbezyl/KaettekudasaiAkutsu_05w.rar.html')


  function listenerPaste(e) {
    if (!(e.clipboardData && e.clipboardData.items)) {
      return
    }
    for (var i = 0, len = e.clipboardData.items.length; i < len; i++) {
      var itemz = e.clipboardData.items[i]
      if (itemz.kind == "string") {
        itemz.getAsString(function (str) {
          setContent(str)
          setIsOpen(true)
        })
      }
    }
  }

  useEffect(() => {
    window.addEventListener('paste', listenerPaste)
    return () => {
      window.removeEventListener('paste', listenerPaste)
    }
  }, [])


  const solutions = [
    {
      name: 'screen1.okakuapp.xyz',
      description: 'debain arm8 6cpu 12gMen',
      href: '##',
      icon: IconOne,
    },
    {
      name: 'screen2.okaku.top',
      description: 'debain arm8 6cpu 12gMen',
      href: '##',
      icon: IconOne,
    },
    {
      name: 'screen3.okaku.top',
      description: 'debain x86 1/8 share cpu 1gMen',
      href: '##',
      icon: IconOne,
    },
    {
      name: 'screen4.okaku.top',
      description: 'debian x86 1/8 share cpu 1gMen',
      href: '##',
      icon: IconOne,
    },

  ]

  function closeModal() {
    setIsOpen(false)
  }
  function paster2server(item) {
    setIsOpen(false)
    fetch(`https://${item.name}:3004/Api/PasteUrl2Desktop/Write?content=${encodeURI(content)}`

      , { mode: 'cors',
       method: "POST", 
       body: JSON.stringify({ content: encodeURI(content) }) ,
        headers:{ "Content-Type":"application/json" }
       })
      .then(res => {
        if (res.status == 200) {
          setIsNotify(true)
          setTimeout(_ => setIsNotify(false), 1000)
        }
      })
      .catch(err => {
        console.error(err)
      })
  }

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Paste this content to server below.
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 break-all">
                      {content}
                    </p>
                    <div className="relative grid gap-8 bg-white p-7 lg:grid-cols-2">
                      {solutions.map((item) => (

                        <a
                          key={item.name}
                          href={item.href}
                          className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                          onClick={() => {
                            paster2server(item)
                          }}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white sm:h-12 sm:w-12">
                            <item.icon aria-hidden="true" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <UINotify
        isOpen={isNotify}
        setIsOpen={setIsNotify}
        title={"已经将以下文本粘贴到服务器"}
        content={content}
      />

    </>
  )
}

function IconOne() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="#FFEDD5" />
      <path
        d="M24 11L35.2583 17.5V30.5L24 37L12.7417 30.5V17.5L24 11Z"
        stroke="#FB923C"
        strokeWidth="2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.7417 19.8094V28.1906L24 32.3812L31.2584 28.1906V19.8094L24 15.6188L16.7417 19.8094Z"
        stroke="#FDBA74"
        strokeWidth="2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.7417 22.1196V25.882L24 27.7632L27.2584 25.882V22.1196L24 20.2384L20.7417 22.1196Z"
        stroke="#FDBA74"
        strokeWidth="2"
      />
    </svg>
  )
}