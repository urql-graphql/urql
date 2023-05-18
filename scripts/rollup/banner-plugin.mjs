export default function banner () {
  return {
    name: 'banner',
    renderChunk (code, chunk) {
      console.log(chunk.name, 'returning', chunk.name === 'urql-next' ? `"use client"\n\n${code}` : code)
      return chunk.name === 'urql-next' ? `"use client"\n\n${code}` : code
    }
  }
}
