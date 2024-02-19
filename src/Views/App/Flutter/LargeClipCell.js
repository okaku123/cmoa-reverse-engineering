import { useCallback } from "react";
import { Handle, Position } from "reactflow";

export default function LargeClipCell({ data }) {
  const { id, type, contentIds, content } = data;
  console.log(data);
  let topArr;
  let bottomArr;
  let lt, rt, lb, rb;

  topArr = content.at(0);

  lt = topArr.at(0);
  rt = topArr.at(1);

  if (content.length > 1) {
    bottomArr = content.at(1);
    lb = bottomArr.at(0);
    rb = bottomArr.at(1);
  }

  let clip1x3End = null;
  if (content.length == 3) {
    clip1x3End = content.at(2).at(0);
  }

  if (type == "2x2") {
    return (
      <div style={{ fontSize: 9 }} className="grid grid-cols-2 gap-0">
        <img className="w-20" src={lt.url}></img>
        <img className="w-20" src={rt.url}></img>
        <img className="w-20" src={lb.url}></img>
        <img className="w-20" src={rb.url}></img>
      </div>
    );
  }

  if (type == "1x2") {
    return (
      <div style={{ fontSize: 9 }} className="grid grid-cols-1 gap-0">
        <img className="w-20" src={lt.url}></img>
        <img className="w-20" src={lb.url}></img>
      </div>
    );
  }
  if (type == "1x3") {
    return (
      <div style={{ fontSize: 9 }} className="grid grid-cols-1 gap-0">
        <img className="w-20" src={lt.url}></img>
        <img className="w-20" src={lb.url}></img>
        <img className="w-20" src={clip1x3End.url}></img>
      </div>
    );
  }
  if (type == "1x1") {
    return (
      <div style={{ fontSize: 9 }} className="grid grid-cols-1 gap-0">
        <img className="w-20" src={lt.url}></img>
      </div>
    );
  }
}
