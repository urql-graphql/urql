// 1. Character Frequency.

/**
 * Calculates the character frequencies in a string. Whitespace and
 * punctuation is ignored. Non-english characters are not counted.
 * Case is ignored ('A' and 'a' both count toward the same character).
 *
 * @param {string} sentence  The string whose characters will be counted
 * @returns {object} An object with keys being lowercase characters, and
 *                   values being the character counts.
 */
function charFreq(sentence) {
  var freqObj = {};
  for (var i = 0; i < sentence.length; i++) {
    //If regEx tests any character (or "word") to be true...
    if ((/\w/.test(sentence[i]))) {
      //If freqObj doesn't yet have this letter as a property, set to 1
      if (!freqObj.hasOwnProperty(sentence[i])) {
        freqObj[sentence[i].toLowerCase()] = 1;
      } else {
        freqObj[sentence[i].toLowerCase()] += 1;
      }
    }
  }
  return freqObj;
}

// 2. Longest Increasing Sub-Array.

/**
 * Finds the longest increasing subarray from a given array
 * of integers. A subarray is said to be "increasing" when each
 * non-last value is followed by a value that is greater
 * than the previous value.
 * If there are multiple contenders of the same length, returns
 * the first occurring subarray.
 * If no increasing sub-array of length 2 or greater is found,
 * returns an empty array.
 *
 * @param {number[]} seq  An array of integers
 * @returns {number[]} The longest increasing subarray of `seq`
 */
// function longestIncrSubArray(seq) {
//   var finalArr = [];
//   var tempArr = [];
//   for (var i = 0; i < seq.length; i++) {
//     //Temporary indicies for looping through a second time
//     var y = i;
//     //While the series continues... NOTE: chose to use a while loop here; could've used a second for-loop, but decided due to the boolean-nature of the process that while was more appropriate.
//     while (seq[y + 1] > seq[y]) {
//       if (y === i) {
//         tempArr.push(seq[y])
//       }
//       tempArr.push(seq[y + 1]);
//       y++;
//     }
//     //Set i = y, y being the highest number is the current series, to avoid going over the same data twice. This is only necessary for performance reasons (and only slightly so at that, but hey, it's one line of code!).
//     i = y;
//     //If our current run exceeds the highest so far, replace!
//     if (tempArr.length > finalArr.length) {
//       finalArr = tempArr;
//       tempArr = [];
//     } else {
//       tempArr = [];
//     }
//   }
//   if (finalArr.length < 2) {
//     finalArr = [];
//   }
//   return finalArr;
// }

function longestIncrSubArray(seq) {
  var longestCounter = 0,
      tempCounter = 0,
      longestIndex;
  for (var i = 0; i < seq.length; i++) {
    if (seq[i] < seq[i+1]) {
      tempCounter++;
      //This if statement handles subarrays at the end of the array
      if (tempCounter > longestCounter && i === seq.length - 1) {
        longestCounter = tempCounter;
        longestIndex = i - tempCounter + 1;
        tempCounter = 0;
      }
    } else {
      if (tempCounter > longestCounter) {
        longestCounter = tempCounter;
        longestIndex = i - tempCounter;
        tempCounter = 0;
      } else {
        tempCounter = 0;
      }
    }
  }
  if (longestCounter < 2) {
    return [];
  } else {
    return seq.slice(longestIndex, longestCounter + longestIndex + 1);
  }
}

// 3. Formidable Series.

/**
 * Takes a start and end integer. Returns an array of the integer series
 * represented by start and end, except:
 *   - If the integer is divisible by 3, the array value is 'Formidable'
 *   - If the integer is divisible by 5; 'Labs'
 *   - If the integer is divisible by 3 and 5; 'FormidableLabs'
 * @param {number} start  Series start value
 * @param {number} end  Series end value (incl.)
 * @returns {(number|string)[]} Series based on above rules
 */
function formidableSeries(start, end) {
  if (start > end) {
    console.error("Start must be less than end.")
  }
  var finalArr = [];
  for (var s = start; s <= end; s++) {
    if (s % 3 === 0 && s % 5 === 0) {
      finalArr.push('FormidableLabs');
    } else if (s % 3 === 0) {
      finalArr.push('Formidable');
    } else if (s % 5 === 0) {
      finalArr.push('Labs');
    } else {
      finalArr.push(s);
    }
  }
  return finalArr;
}