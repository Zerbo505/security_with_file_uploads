export default function groupArray(array: Record<string, any>[], key: string) {
  const groupedArray: Record<string, any[]> = {};
  for (const urlObject of array) {
    const currentKey = urlObject[key]

    if (!groupedArray[currentKey]) {
      groupedArray[currentKey] = [];
    }
    groupedArray[currentKey].push(urlObject)
  }

  return groupedArray;
}