import { useState, useEffect, useRef, createRef, useContext, useReducer } from 'react'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import "./main.css"
import { nanoid } from 'nanoid';
import lodash from 'lodash'

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


export default function Header(props) {
    const { currentPage, setCurrentPage } = props

    const [progress, setProgress] = useState(3)
    const [searchLoadingbottomClip, setSearchLoadingbottomClip] = useState(false)

    return (
        <>
            <div className="navbar w-full bg-base-100 flex justify-between items-center">
                <a className="btn btn-ghost text-sm navbar-start">img-entropy</a>
                <div className='navbar-center'>

                    <div role="tablist" className="tabs tabs-boxed">
                        <a role="tab" className={currentPage == "0" ? "tab tab-active" : "tab"}
                            onClick={() => setCurrentPage("0")}
                        >初级</a>
                        <a role="tab" className={currentPage == "1" ? "tab tab-active" : "tab"}
                            onClick={() => setCurrentPage("1")}
                        >中级</a>
                        <a role="tab" className={currentPage == "2" ? "tab tab-active" : "tab"}
                            onClick={() => setCurrentPage("2")}
                        >最后</a>
                    </div>

                </div>
            </div>
            <div className="navbar w-full bg-base-100  flex flex-col justify-start items-start">
                <label className='btn btn-sm btn-ghost '
                    onClick={() => {
                    }}
                >
                    {searchLoadingbottomClip &&
                        <span className="loading loading-spinner"></span>
                    }
                    搜索第一批
                </label>

                <div className="navbar-end">
                    <div class="mx-5">
                        <div className="tooltip tooltip-left tooltip-accent" data-tip={progress}>
                            <input type="range"
                                min={3}
                                max={28}
                                value={progress}
                                onChange={e => {
                                    setProgress(e.target.value)
                                }}
                                onMouseUp={e => {

                                }}
                                className="range range-primary range-xs"
                                step={1} />
                        </div>

                        <div
                            style={{ transform: 'scale(1, 0.5)' }}
                            className="w-full flex justify-between text-xs px-2">
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}


