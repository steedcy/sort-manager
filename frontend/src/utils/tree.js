export function buildLocationTreeOptions(locations) {
  const map = new Map()
  locations.forEach(loc => {
    map.set(loc.id, { ...loc, children: [] })
  })

  const roots = []
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const result = []

  function traverse(node, depth, isLast, parentPath = '') {
    let prefix = ''
    if (depth > 0) {
      prefix = '\u00A0\u00A0\u00A0\u00A0'.repeat(depth - 1)
      prefix += isLast ? '└─ ' : '├─ '
    }
    
    result.push({
      ...node,
      treeName: prefix + node.name,
      canonicalPath: parentPath ? `${parentPath} > ${node.name}` : node.name
    })

    if (node.children) {
      node.children.forEach((child, index) => {
        traverse(child, depth + 1, index === node.children.length - 1, parentPath ? `${parentPath} > ${node.name}` : node.name)
      })
    }
  }

  roots.forEach(root => traverse(root, 0, false, ''))
  return result
}
