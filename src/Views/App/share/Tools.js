function sizeReading(number) {
    if (number > 1024 * 1024 * 1024) {
      return `${(number / (1024 * 1024 * 1024)).toFixed(1)}G`
  
    } else if (number > 1024 * 1024) {
      return `${(number / (1024 * 1024)).toFixed(1)}M`
    } else if (number > 1024) {
      return `${(number / (1024)).toFixed(1)}K`
    } else {
      return number
    }
  }

  function fileNameWithoutExtensionName(file){
    // console.log(file)
    let { name } = file
    const index = name.lastIndexOf(".")
    if (index == -1) return name
    return name.slice(0, index - 1)
}

function getType(type){
  switch (type) {
      case "danxinben":
          return "单行本";
      case "douji":
          return "同人誌";
      case "magazine":
          return "雑誌";
      case "omeyage":
          return "贈り";
      case "twitter":
          return "twitter";
      default:
          return "单行本";
  }

}


  


export  { sizeReading  , fileNameWithoutExtensionName  , getType }