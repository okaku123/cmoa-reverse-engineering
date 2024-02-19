import {
  useState,
  useEffect,
  useRef,
  createRef,
  useContext,
  useReducer,
} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "./main.css";
import { nanoid } from "nanoid";
import lodash from "lodash";
import Header from "./Header";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// 1551 × 2164 realfile
// 1487\" orgheight=\"2100 show

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imgUrl = "./sbcGetImg1.jpg";

function imgLoad(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

export default function ClipScreen(props) {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [clipImgScale, setClipImgScale] = useState(null);
  const [imgSize, setImgSize] = useState(null);

  const [verticalClipLine, setVerticalClipLine] = useState([]);
  const [horizontalClipLine, setHorizontalClipLine] = useState([]);
  const horizontalClipLineRefs = useRef([]);
  const verticalClipLineRefs = useRef([]);

  const getHorizontalClipLineRef = (dom) => {
    if (dom) {
      horizontalClipLineRefs.current.push(dom);
    }
  };
  const getVerticalClipLineRef = (dom) => {
    if (dom) {
      verticalClipLineRefs.current.push(dom);
    }
  };

  const [clipCoordinate, setClipCoordinate] = useState(null);

  async function loadScaleImg() {
    const img = await imgLoad(imgUrl);
    setClipImgScale(imgUrl);
    console.log(img.width, img.height);
    setImgSize({ width: img.width, height: img.height });
    initVerticalClipLine(img);
    initHorizontalClipLine(img);
    // console.log( img.width, img.height )
    // const canvas = document.createElement("canvas")
    // const ctx = canvas.getContext("2d")
    // ctx.drawImage( img,  )
  }

  function initVerticalClipLine(img) {
    const temp = [];
    for (let index = 0; index < 8; index++) {
      temp.push({ id: nanoid(), left: (img.width / 8) * index });
    }
    setVerticalClipLine(temp);
  }

  function initHorizontalClipLine(img) {
    const temp = [];
    for (let index = 0; index < 8; index++) {
      temp.push({ id: nanoid(), top: (img.height / 8) * index });
    }
    setHorizontalClipLine(temp);
  }

  function saveResult() {
    let result = { horizontal: [], vertical: [] };
    for (let i = 0; i < 8; i++) {
      const horizontalClipLine = document.body.querySelector(
        `#horizontalClipLine-${i}`,
      );
      result.horizontal.push(horizontalClipLine.getBoundingClientRect().top);
      const verticalClipLine = document.body.querySelector(
        `#verticalClipLine-${i}`,
      );
      result.vertical.push(verticalClipLine.getBoundingClientRect().left);
    }
    setClipCoordinate(result);
  }

  useEffect(() => {
    loadScaleImg();
  }, []);

  return (
    <>
      <div className="container-full w-full  bg-base-100 overflow-scroll">
        <div className="w-full flex justify-end">
          {clipImgScale && imgSize && (
            <>
              <img
                src={clipImgScale}
                className="block  absolute top-0 left-0 "
                style={{ width: imgSize.width, height: imgSize.height }}
              />

              <div
                className=" absolute bg-black z-50 top-0 left-0 bg-opacity-50"
                style={{ width: imgSize.width, height: imgSize.height }}
              >
                {verticalClipLine.map((item, index) => {
                  return (
                    <motion.div
                      id={`verticalClipLine-${index}`}
                      ref={getHorizontalClipLineRef}
                      drag="x"
                      key={item.id}
                      className="w-[1px] h-full bg-red-600 top-0 absolute "
                      style={{ left: item.left }}
                    >
                      <div className=" absolute top-0 w-8 h-8 rounded-md bg-red-600 text-white text-lg text-center font-extrabold opacity-100 z-[100]">
                        {index + 1}
                      </div>
                    </motion.div>
                  );
                })}

                {horizontalClipLine.map((item, index) => {
                  return (
                    <motion.div
                      drag="y"
                      id={`horizontalClipLine-${index}`}
                      ref={getVerticalClipLineRef}
                      key={item.id}
                      className="h-[1px] w-full bg-yellow-500 top-0 absolute"
                      style={{ top: item.top }}
                    >
                      <div className=" absolute right-0 w-8 h-8 rounded-md bg-yellow-500 text-white text-lg text-center font-extrabold opacity-100 z-[100]">
                        {index + 1}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          <div className="w-44 flex justify-end flex-col ">
            <div className="divider"></div>

            <label
              className="btn btn-sm btn-primary mx-5"
              onClick={(e) => {
                navigate("/clip", { state: { clipCoordinate, imgSize } });
              }}
            >
              跳转切片
            </label>
            <div className="divider"></div>

            <label
              className="btn btn-sm btn-primary mx-5"
              onClick={(e) => {
                saveResult();
              }}
            >
              保存
            </label>

            <div className="divider">horizontal</div>
            <div className="w-full flex justify-end">
              {clipCoordinate && (
                <div>
                  {clipCoordinate.horizontal.map((item, index) => {
                    return (
                      <label key={index} className="block text-xs">
                        {item}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="divider">vertical</div>

            <div className="w-full flex justify-end">
              {clipCoordinate && (
                <div>
                  {clipCoordinate.vertical.map((item, index) => {
                    return (
                      <label key={index} className="block text-xs">
                        {item}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* <div className='w-full overflow-y-scroll'>
                    {clipImgScale && imgSize &&
                        <>
                            <img src={clipImgScale}
                                className='block  absolute top-0 left-0 '
                                style={{ width: imgSize.width, height: imgSize.height }}
                            />

                            <div className=' absolute bg-black z-50 top-0 left-0 bg-opacity-50'
                                style={{ width: imgSize.width, height: imgSize.height }}
                            >
                                {verticalClipLine.map((item, index) => {

                                    return (
                                        <motion.div
                                            id={`verticalClipLine-${index}`}
                                            ref={getHorizontalClipLineRef}
                                            drag="x"
                                            key={item.id}
                                            className='w-[1px] h-full bg-red-600 top-0 absolute '
                                            style={{ left: item.left }} >
                                                 <div className=' absolute top-0 w-8 h-8 rounded-md bg-red-600 text-white text-lg text-center font-extrabold opacity-100 z-[100]'>
                                                {index + 1}
                                            </div>
                                            </motion.div>
                                    )
                                })
                                }

                                {horizontalClipLine.map((item, index) => {


                                    return (
                                        <motion.div
                                            drag="y"
                                            id={`horizontalClipLine-${index}`}
                                            ref={getVerticalClipLineRef}
                                            key={item.id}
                                            className='h-[1px] w-full bg-yellow-500 top-0 absolute'
                                            style={{ top: item.top }} >
                                            <div className=' absolute right-0 w-8 h-8 rounded-md bg-yellow-500 text-white text-lg text-center font-extrabold opacity-100 z-[100]'>
                                                {index + 1}
                                            </div>
                                        </motion.div>
                                    )
                                })
                                }

                            </div>
                        </>
                    }
                </div> */}
      </div>
    </>
  );
}
