import {
  useState,
  useEffect,
  useRef,
  createRef,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "./main.css";
import { nanoid } from "nanoid";
import lodash from "lodash";
import { calculateEntropy, findClosestNumber } from "./Tools";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
} from "reactflow";
import LargeClipCell from "./LargeClipCell";

import "reactflow/dist/style.css";
const viewHeight = "calc(100vh - 64px)";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imgUrl = "./sbcGetImg1.jpg";

// const initialNodes = [
//     { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
//     { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
// ];

// const initialNodes = [
//     {
//       id: 'node-1',
//       type: 'textUpdater',
//       position: { x: 0, y: 0 },
//       data: { value: 123 },
//     },
//   ];

const initialEdges = [];

function imgLoad(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

export default function Phase3Screen(props) {
  const largeClipType = useMemo(() => ({ largeClip: LargeClipCell }), []);

  const {
    confirmClipImgs,
    setConfirmClipImgs,
    currentSelectedPair,
    setCurrentSelectedPair,
    candidateLeftClipImgs,
    setCandidateLeftClipImgs,
    candidateRightClipImgs,
    setCandidateRightClipImgs,
    confirmLargeClipImgs,
    setConfirmLargeClipImgs,
    unCheckConfirmClipImgs,
    setUnCheckConfirmClipImgs,
    unCheck1X1Imgs,
  } = props;

  const [confirmLargeClipImgNodes, setConfirmLargeClipImgNodes] = useState([]);

  // const initialNodes = [
  //     {
  //       id: 'node-1',
  //       type: 'textUpdater',
  //       position: { x: 0, y: 0 },
  //       data: { value: 123 },
  //     },
  //   ];

  const clipImgsRef = useRef();

  function searchCandidateLeftClipImgs(currentSelectedPair) {
    const index = confirmClipImgs.findIndex((item) => {
      return item.id == currentSelectedPair.id;
    });
    let temp = Array.from(confirmClipImgs);
    temp = temp.filter((item) => {
      return !item.confirm.r;
    });
    temp.splice(index, 1);
    setCandidateLeftClipImgs(temp);
  }

  function searchCandidateRightClipImgs(currentSelectedPair) {
    const index = confirmClipImgs.findIndex((item) => {
      return item.id == currentSelectedPair.id;
    });
    let temp = Array.from(confirmClipImgs);
    temp = temp.filter((item) => {
      return !item.confirm.l;
    });
    temp.splice(index, 1);
    setCandidateRightClipImgs(temp);
  }

  function unCheckLargeClip(clip) {
    const index = confirmLargeClipImgs.findIndex((item) => item.id == clip.id);
    confirmLargeClipImgs.splice(index, 1);

    setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
  }

  useEffect(() => {
    if (currentSelectedPair) {
      searchCandidateLeftClipImgs(currentSelectedPair);
      searchCandidateRightClipImgs(currentSelectedPair);
    }
  }, [currentSelectedPair]);

  useEffect(() => {
    let row = 0;
    let rowCount = 0;
    let col = 0;
    let nodes = [];
    for (let confirmLargeClipImg of confirmLargeClipImgs) {
      const position = { x: (160 + 20) * rowCount, y: (260 + 5) * col };
      nodes.push({
        id: confirmLargeClipImg.id,
        type: "largeClip",
        position,
        data: confirmLargeClipImg,
      });
      rowCount += 1;
      if (rowCount == 3) {
        row += 1;
        col += 1;
        rowCount = 0;
      }
    }

    //    let confirmLargeClipImgNode = confirmLargeClipImgs.map(item => {
    //         let node = {
    //             id: item.id,
    //             type: "largeClip",
    //             position: { x: 0, y: 0 },
    //             data: item
    //         }
    //         return node
    //     })
    setConfirmLargeClipImgNodes(nodes);
  }, [confirmLargeClipImgs]);

  const onConnect = useCallback((params) => {}, []);

  const onNodesChange = useCallback(
    (changes) =>
      setConfirmLargeClipImgNodes((nds) => applyNodeChanges(changes, nds)),
    [setConfirmLargeClipImgNodes],
  );

  //     const nodes = [
  //   {
  //     id: 'node-1',
  //     type: 'textUpdater',
  //     position: { x: 0, y: 0 },
  //     data: { value: 123 },
  //   },
  // ];

  function add2X1ClipImgs(item) {
    let maxY = 0;
    for (let confirmLargeClipImgNode of confirmLargeClipImgNodes) {
      if (confirmLargeClipImgNode.position.y > maxY) {
        maxY = confirmLargeClipImgNode.position.y;
      }
    }
    let position = { x: 0, y: maxY };
    console.log(item);
    confirmLargeClipImgNodes.push({
      id: item.id,
      type: "largeClip",
      position,
      data: item,
    });
    setConfirmLargeClipImgNodes(Array.from(confirmLargeClipImgNodes));
  }

  function add1X1ClipImgs(item) {
    console.log(item);
    item.content = [[item]];
    let maxY = 0;
    for (let confirmLargeClipImgNode of confirmLargeClipImgNodes) {
      if (confirmLargeClipImgNode.position.y > maxY) {
        maxY = confirmLargeClipImgNode.position.y;
      }
    }
    let position = { x: 0, y: maxY };
    console.log(item);
    confirmLargeClipImgNodes.push({
      id: item.id,
      type: "largeClip",
      position,
      data: item,
    });
    setConfirmLargeClipImgNodes(Array.from(confirmLargeClipImgNodes));
  }

  return (
    <>
      <div
        style={{ height: viewHeight }}
        className="w-full flex justify-between items-start"
      >
        <div className="w-[360px]">
          <div class=" my-4 grid grid-cols-2 gap-4 overflow-x-scroll">
            {confirmLargeClipImgs.map((item, index) => {
              const { id, type, content } = item;
              if (type == "3x2") {
                const lt = content.at(0).at(0);
                const ct = content.at(0).at(1);
                const rt = content.at(0).at(2);

                const lb = content.at(1).at(0);
                const cb = content.at(1).at(1);
                const rb = content.at(1).at(2);

                return (
                  <div
                    key={id}
                    className="grid grid-cols-3 gap-0"
                    onClick={(e) => {
                      unCheckLargeClip(item);
                    }}
                  >
                    <img className="w-20" src={lt.url}></img>
                    <img className="w-20" src={ct.url}></img>
                    <img className="w-20" src={rt.url}></img>
                    <img className="w-20" src={lb.url}></img>
                    <img className="w-20" src={cb.url}></img>
                    <img className="w-20" src={rb.url}></img>
                  </div>
                );
              } else {
                const lt = content.at(0).at(0);
                const rt = content.at(0).at(1);
                const lb = content.at(1).at(0);
                const rb = content.at(1).at(1);

                return (
                  <div
                    style={{ fontSize: 9 }}
                    className="grid grid-cols-2 gap-0"
                    onClick={(e) => {
                      unCheckLargeClip(item);
                    }}
                  >
                    <img className="w-20" src={lt.url}></img>
                    <img className="w-20" src={rt.url}></img>
                    <img className="w-20" src={lb.url}></img>
                    <img className="w-20" src={rb.url}></img>
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div className="divider divider-horizontal"></div>

        <div className="w-[320px] flex justify-between items-start ">
          <div
            style={{ height: viewHeight }}
            class=" my-0 grid grid-cols-4 gap-4 overflow-x-scroll"
          >
            {unCheckConfirmClipImgs.map((item, index) => {
              let { id, type, content } = item;
              let clipTop = content.at(0).at(0);
              let clipBottom = content.at(1).at(0);

              let confirm = false;

              if (!!item.confirm.l) {
                confirm = true;
              }
              if (!!item.confirm.r) {
                confirm = true;
              }

              return (
                <div
                  key={id}
                  Key={"confirmClipImgs" + clipTop.id}
                  style={{ fontSize: 9 }}
                  className=""
                  onClick={() => {
                    add2X1ClipImgs(item);
                  }}
                >
                  <div className="text-center">{clipTop.entropy.t}</div>
                  <div
                    style={{ opacity: confirm ? 0.5 : 1 }}
                    className="flex flex-col justify-start items-center cursor-pointer"
                    onClick={() => {
                      setCurrentSelectedPair(item);
                    }}
                  >
                    <img className="w-20" src={clipTop.url}></img>
                    <img className="w-20" src={clipBottom.url}></img>
                  </div>
                  <div className="text-center">{clipBottom.entropy.b}</div>
                </div>
              );
            })}
            {unCheck1X1Imgs.map((clipImg, index) => {
              const { url, entropy } = clipImg;
              let confirm = false;

              if (!!clipImg.confirm.b) {
                confirm = true;
              }
              if (!!clipImg.confirm.t) {
                console.log("!!clipImg.confirm.t)");
                confirm = true;
              }

              return (
                <div
                  key={clipImg.renderId}
                  onClick={() => {
                    add1X1ClipImgs(clipImg);
                  }}
                >
                  <img
                    className="w-20"
                    src={url}
                    style={{ opacity: confirm ? 0.5 : 1 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="divider divider-horizontal"></div>
        {/* 已经确认的大切片 */}
        <div
          className=""
          style={{ height: viewHeight, width: "calc(100vw - 360px)" }}
        >
          <ReactFlow
            fitView
            nodes={confirmLargeClipImgNodes}
            // edges={edges}
            onNodesChange={onNodesChange}
            // onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={largeClipType}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </>
  );
}
