import heapq

graph = {
'A': {'B': 2, 'C': 1},
'B': {'D': 4, 'E': 3},
'C': {'F': 1, 'G': 5},
'D': {'H': 2},
'E': {},
'F': {'I': 6},
'G': {},
'H': {},
'I': {}
}
# Heuristic function (estimated cost to reach goal 'I')
heuristic = {
'A': 7,
'B': 6,
'C': 5,
'D': 4,
'E': 7,
'F': 3,
'G': 6,
'H': 2,
'I': 0 # Goal node
}

def greedy_bfs(graph,start,goal):
    frontier = [(heuristic[start],start)]
    visited = set()
    
    # frontier = [(heuristic[start],start)]
    # visited = set()
    # came_from = {start: None}

    # while frontier:
    #     cost, node = heapq.heappop(frontier)

    #     print("Node visited:", node)
        
    #     if node in visited:
    #         continue
    #     visited.add(node)

    #     if node == goal:
    #         path = []
    #         while node is not None:
    #             path.append(node)
    #             node = came_from[node]
            
    #         return path
        
        
    #     for neighbour, cost in graph.get(node, {}).items():
    #         if neighbour not in visited:
    #             came_from[neighbour] = node
    #             heapq.heappush(frontier,(heuristic[neighbour],neighbour))
            





greedy_bfs(graph, 'A', 'I')