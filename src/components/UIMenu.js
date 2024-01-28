import { Dialog,  Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function UIMenu(props) {
    const { isOpen, setIsOpen, content , menuPostion } = props
    //   let [isOpen, setIsOpen] = useState(true)

    function closeModal() {
        setIsOpen(false)
    }

    //   function openModal() {
    //     setIsOpen(true)
    //   }

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
                        <div className="fixed inset-0 bg-black bg-opacity-0" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className=" min-h-full   p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100 "
                                leaveTo="opacity-0 scale-95 "
                            >
                                <Dialog.Panel className={`fixed 
                                  w-56 transform 
                                  rounded-2xl bg-white text-left h-min
                                  align-middle drop-shadow-2xl transition-all`}
                                    style={{ top: menuPostion.clientY, left: menuPostion.clientX }} >

                                    <div static="true" className="absolute right-0 mt-2 w-56 origin-top-right 
          divide-y divide-gray-100 rounded-md bg-white  
           ring-black ring-opacity-5 outline-none h-auto">
                                                {content}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}

