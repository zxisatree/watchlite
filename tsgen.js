// Generates a list of TailwindCSS style strings
// From https://tailwindcss.com/docs/customizing-colors:
// Array.from(document.querySelectorAll("#content-wrapper > div:nth-child(4) > div > div:first-child")).map(element => element.textContent.toLowerCase()).join("\",\"")
// .forEach(element => console.log(element.textContent.toLowerCase()))
const colours = ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"]

/** Replace return value with template */
function generateTile(colour) {
  return `bg-${colour}-200 hover:bg-${colour}-400 p-2 rounded-lg mt-2 transition-colors`
}

function generateActiveTile(colour) {
  return `bg-${colour}-500 hover:bg-${colour}-700 p-2 rounded-lg mt-2 transition-colors`
}

function generateSidebarPlaylistButton(colour) {
  return `bg-${colour}-200 hover:bg-${colour}-400 rounded-lg transition-colors font-semibold p-1 pl-2`
}

function generateActiveSidebarPlaylistButton(colour) {
  return `bg-${colour}-500 hover:bg-${colour}-700 rounded-lg transition-colors font-semibold p-1 pl-2`
}

const styleName = "ActiveSidebarPlaylistButton"
const generate = generateActiveSidebarPlaylistButton

for (const colour of colours) {
  console.log(`export const ${colour}${styleName} = '` + generate(colour) + `'`)
}
