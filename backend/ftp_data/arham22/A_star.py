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

def a_star(start,goal,graph):
    frontier = [(0+heuristic[start],start)]
    visited= set()
    g_cost = {start:0}
    came_from = {start:None}

    while frontier:
        cost, node = heapq.heappop(frontier)
        print("Node visited: ", node)
        if node in visited:
            continue

        visited.add(node)


        if node == goal:
            path = []
            while node is not None:
                path.append(node)
                node = came_from[node]

            print(path[::-1])
            return
        
        for neighbour, curr_cost in graph.get(node ,{}).items():
            gn = curr_cost+ g_cost[node]
            f_cost = gn + heuristic[neighbour]
            if neighbour not in g_cost or gn< g_cost[neighbour]:
                g_cost[neighbour] = gn
                came_from[neighbour] = node
                heapq.heappush(frontier,(f_cost,neighbour))





a_star("A","I",graph)