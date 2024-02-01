import { useState, useEffect, useRef, createRef, useContext, useReducer } from 'react'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import "./main.css"
import { nanoid } from 'nanoid';
import lodash from 'lodash'
import Header from "./Header"
import { useLocation } from 'react-router';
import Phase1Screen from './Phase1Screen';
import Phase2Screen from './Phase2Screen';
import { calculateEntropy, findClosestNumber } from "./Tools";
import { useLatest } from "react-use";

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const imgUrl = "./sbcGetImg1.jpg"

function imgLoad(url) {
    return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
            resolve(img)
        }
        img.src = url
    })
}

export default function MainScreen(props) {

    const location = useLocation();
    const clipCoordinate = location.state.clipCoordinate;
    const imgSize = location.state.imgSize;

    const calcHeight = 3;

    const [progress, setProgress] = useState(3);

    const [mainImg, setMainImg] = useState(null);
    const [tempClipImgs, setClipImgs] = useState([]);
    const latestTempClipImgs = useLatest(tempClipImgs)
    const clipImgsRef = useRef();
    const unClipedBottomImagesRef = useRef();
    const [searchLoadingbottomClip, setSearchLoadingbottomClip] = useState(false);
    const bottomClipIndexsRef = useRef();

    const [currentSelectedClipImg, setCurrentSelectedClipImg] = useState(null);
    //顶部可能匹配的切片
    const [candidateClipImgs, setCandidateClipImgs] = useState([]);
    //底部可能匹配的切片
    const [candidateBottomClipImgs, setCandidateBottomClipImgs] = useState([]);

    const [unConfirmClipImgs, setUnConfirmClipImgs] = useState([]);
    const latestUnConfirmClipImgs = useLatest(unConfirmClipImgs);
    /**
     * 已经确认的切片 初级
     */
    const [confirmClipImgs, setConfirmClipImgs] = useState([]);
    const latestConfirmClipImgs = useLatest(confirmClipImgs);

    const [currentPage, setCurrentPage] = useState("0");

    const [currentSelectedPair, setCurrentSelectedPair] = useState(null);
    const [candidateLeftClipImgs, setCandidateLeftClipImgs] = useState([]);
    const [candidateRightClipImgs, setCandidateRightClipImgs] = useState([]);

    const [confirmLargeClipImgs, setConfirmLargeClipImgs] = useState([]);
    const [_clipCoordinate, setClipCoordinate] = useState(null);
    const currentFiexd = useRef({ top: 0, left: 0, bottom: 0, right: 0 });

    const corpOffsetRef = useRef({ top: 0, left: 0, bottom: 0, right: 0 });


    useEffect(() => {
        const { width, height } = imgSize
        console.log(width, height)
        const { horizontal, vertical } = clipCoordinate
        //将切割坐标处理为canvas切割用的偏移量
        let temp = []
        for (let i = 0; i < 8; i++) {
            const H = horizontal[i]
            let nextH
            if (i == 7) {
                nextH = height
            } else {
                nextH = horizontal[i + 1]
            }
            for (let j = 0; j < 8; j++) {
                const W = vertical[j]
                let nextW
                if (j == 7) {
                    nextW = width
                } else {
                    nextW = vertical[j + 1]
                }

                const offsetX = W
                const offsetY = H
                const clipWidth = nextW - W
                const clipHeight = nextH - H

                temp.push({ offsetX, offsetY, clipWidth, clipHeight })
            }
        }

        setClipCoordinate(temp)
        console.log(temp)
    }, [clipCoordinate, imgSize])

    useEffect(() => {
        if (!!_clipCoordinate) {
            (async () => {
                await delay(60)
                await prepareImgClips2()
            })()
        }
    }, [_clipCoordinate])

    //ban
    // useEffect(() => {
    //     if (currentSelectedClipImg) {
    //         searchCandidateClipImgs(currentSelectedClipImg)
    //         searchCandidateBottomClipImgs(currentSelectedClipImg)
    //     }
    // }, [currentSelectedClipImg])

    //重新搜索底部一排的切片,排除掉已经被选中的切片
    async function searchBottomClip() {
        setSearchLoadingbottomClip(true)

        let unConfirmClipImgs = Array.from(clipImgsRef.current)
        let unClipedBottomImages = Array.from(unClipedBottomImagesRef.current)
        //过滤掉已经确认的切片
        unConfirmClipImgs = unConfirmClipImgs.filter(item => !item.confirm)
        //排除掉确认不匹配的切片
        unConfirmClipImgs = unConfirmClipImgs.filter(item => !item.mismatch)
        //


        let searchedClipIds = []
        let index = 0
        for (let unClipedBottomImage of unClipedBottomImages) {
            const itemPostion = `1-${index}`


            const _unConfirmClipImgs = unConfirmClipImgs.filter(item => {
                let filter = true
                if (item.mismatchArrary.length > 0) {
                    if (~item.mismatchArrary.findIndex(mismatchItem => mismatchItem == itemPostion)) {
                        filter = false
                    }
                }
                return filter
            })

            let unConfirmClipImgsBottomEntropys = _unConfirmClipImgs.map(item => {
                const { id, entropy } = item
                return { id, entropy: entropy.b }
            })

            if (unClipedBottomImage.clip && unClipedBottomImage.clip.confirm) {
                searchedClipIds.push(unClipedBottomImage.clip.id)
            } else {
                const unClipedBottomImageEntropy = unClipedBottomImage.entropy // 顶部切片顶部的的熵
                const entropys = unConfirmClipImgsBottomEntropys.map(item => item.entropy) //没有确定的切片的所有的底部熵
                let { index: indexofEntropys, closestNumber } = findClosestNumber(entropys, unClipedBottomImageEntropy)
                let id = unConfirmClipImgsBottomEntropys[indexofEntropys].id //熵最接近的切片的id
                searchedClipIds.push(id)
            }
            index += 1
        }

        let bottomClipIndexs = []
        for (const searchedClipId of searchedClipIds) {
            const unConfirmClipImg = clipImgsRef.current.find(item => item.id == searchedClipId)
            bottomClipIndexs.push(unConfirmClipImg)
        }

        // setBottomClipIndexs(bottomClipIndexs)
        bottomClipIndexsRef.current = bottomClipIndexs

        await delay(200)
        setSearchLoadingbottomClip(false)

    }

    async function prepareImgClips2() {
        const img0 = await imgLoad(imgUrl);
        console.log(img0.width, img0.height);
        setMainImg(imgUrl);
        let clipImgs = [];
        let index = 0;
        for (const coordinate of _clipCoordinate) {
            const { offsetX, offsetY, clipWidth, clipHeight } = coordinate;
            var blockCanvas = document.createElement("canvas");
            blockCanvas.width = clipWidth;
            blockCanvas.height = clipHeight;
            console.log(clipHeight);
            var blockCtx = blockCanvas.getContext("2d");
            blockCtx.drawImage(
                img0,
                offsetX,
                offsetY,
                clipWidth,
                clipHeight,
                0,
                0,
                clipWidth,
                clipHeight,
            );

            var imageData_b = blockCtx.getImageData(
                0,
                clipHeight - calcHeight,
                clipWidth,
                calcHeight,
            );
            var entropy_b = calculateEntropy(imageData_b.data);

            var imageData_t = blockCtx.getImageData(0, 0, clipWidth, calcHeight);
            var entropy_t = calculateEntropy(imageData_t.data);

            var imageData_l = blockCtx.getImageData(0, 0, calcHeight, clipHeight);
            var entropy_l = calculateEntropy(imageData_l.data);

            var imageData_r = blockCtx.getImageData(
                0,
                clipWidth - calcHeight,
                calcHeight,
                clipHeight,
            );
            var entropy_r = calculateEntropy(imageData_r.data);

            // 将小块Canvas转换为DataURL或进行其他操作
            var blockDataURL = blockCanvas.toDataURL();

            clipImgs.push({
                renderId: nanoid(),
                id: nanoid(),
                coordinate,
                originIndex: index,
                originWidth: clipWidth,
                originHeight: clipHeight,
                fiexd: { top: 0, left: 0, bottom: 0, right: 0 },
                url: blockDataURL,
                entropy: { l: entropy_l, r: entropy_r, t: entropy_t, b: entropy_b },
                confirm: {},
                mismatchTopArrary: [],
                mismatchBottomArrary: [],
            });
            index += 1;
        }
        setClipImgs(clipImgs);
        clipImgsRef.current = clipImgs;
        setUnConfirmClipImgs(clipImgs);
    }

    function saveList() {
        const latestConfirmClipImgsStr = JSON.stringify(latestConfirmClipImgs.current)
        console.log(latestConfirmClipImgsStr)
    }

    return (
        <>
            <div className='container-full w-full h-full bg-base-100 overflow-hidden'>
                <Header
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    saveList={saveList} />
                {currentPage == "1" &&
                    <Phase2Screen
                        confirmClipImgs={confirmClipImgs}
                        setConfirmClipImgs={setConfirmClipImgs}
                        currentSelectedPair={currentSelectedPair}
                        setCurrentSelectedPair={setCurrentSelectedPair}
                        candidateLeftClipImgs={candidateLeftClipImgs}
                        setCandidateLeftClipImgs={setCandidateLeftClipImgs}
                        candidateRightClipImgs={candidateRightClipImgs}
                        setCandidateRightClipImgs={setCandidateRightClipImgs}
                        confirmLargeClipImgs={confirmLargeClipImgs}
                        setConfirmLargeClipImgs={setConfirmLargeClipImgs}
                    />
                }
                {currentPage == "0" &&
                    <Phase1Screen
                        tempClipImgs={tempClipImgs}
                        setClipImgs={setClipImgs}
                        currentSelectedClipImg={currentSelectedClipImg}
                        setCurrentSelectedClipImg={setCurrentSelectedClipImg}
                        candidateClipImgs={candidateClipImgs}
                        setCandidateClipImgs={setCandidateClipImgs}
                        candidateBottomClipImgs={candidateBottomClipImgs}
                        setCandidateBottomClipImgs={setCandidateBottomClipImgs}
                        latestUnConfirmClipImgs={latestUnConfirmClipImgs}
                        latestConfirmClipImgs={latestConfirmClipImgs}
                        unConfirmClipImgs={unConfirmClipImgs}
                        setUnConfirmClipImgs={setUnConfirmClipImgs}
                        confirmClipImgs={confirmClipImgs}
                        setConfirmClipImgs={setConfirmClipImgs}
                        currentFiexd={currentFiexd}
                        corpOffsetRef={corpOffsetRef}
                        calcHeight={calcHeight}
                        latestTempClipImgs={latestTempClipImgs}

                    />
                }
            </div>
        </>
    )

}


