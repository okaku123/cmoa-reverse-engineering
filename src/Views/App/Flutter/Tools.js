function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    if (formattedHours == "00") {
        if (formattedMinutes == "00") {
            return `${formattedSeconds}秒`
        } else {
            return `${formattedMinutes}分${formattedSeconds}秒`
        }
    } else {
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
}

// 计算熵的函数
export function calculateEntropy(pixels) {
    var histogram = {};
    var totalPixels = pixels.length / 4;
    var entropy = 0;

    // 统计像素值的频率
    for (var i = 0; i < pixels.length; i += 4) {
        var r = pixels[i];
        var g = pixels[i + 1];
        var b = pixels[i + 2];
        var key = r + ',' + g + ',' + b;

        if (histogram[key]) {
            histogram[key]++;
        } else {
            histogram[key] = 1;
        }
    }

    // 计算熵
    for (var key in histogram) {
        var frequency = histogram[key] / totalPixels;
        entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
}
export function findClosestNumber(arr, target) {
    // 初始化最小差值为无穷大
    var minDiff = Infinity;
    var closestNumber;
    var index = 0
    // 遍历数组
    for (var i = 0; i < arr.length; i++) {
        // 计算当前元素与目标数字的差值的绝对值
        var diff = Math.abs(arr[i] - target);

        // 如果差值更小，则更新最小差值和最接近的数字
        if (diff < minDiff) {
            minDiff = diff;
            closestNumber = arr[i];
            index = i
        }
    }

    return { index, closestNumber }
}
