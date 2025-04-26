tree = {
  'A': ['B', 'C'],
  'B': ['D', 'E'],
  'C': ['F', 'G'],
  'D': ['H'],
  'E': [],
  'F': ['I'],
  'G': [],
  'H': [],
  'I': []
}

def dls(start,goal,tree,depth_max):
   
    visited = []
    def dfs(node, depth):
        if depth> depth_max:
            return None
        
        visited.append(node)
        if node == goal:
            print("Path found: ", visited)

        
        for neighbour in tree.get(node, []):
            if neighbour not in visited:
               path = dfs(neighbour,depth+1) 
               if path:
                return path
        visited.pop()
        return None 
        
    return dfs(start,0)


start = "A"
goal = "I"
depth_limit = 3
dls(start,goal,tree, depth_limit)