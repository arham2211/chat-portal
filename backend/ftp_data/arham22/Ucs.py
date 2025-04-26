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

def ucs(start,goal,graph):
    frontier = [(0,start)]
    visited = set()
    cost_so_far = {start:0}
    came_from = {start: None}

    while frontier:
        cost, node = heapq.heappop(frontier)
        if node in visited:
            continue

        if node == goal:
            path = []
            while node is not None:
                path.append(node)
                node = came_from[node]
            print("Path: ",path[::-1])
            return

        for neighbour, curr_cost in graph.get(node,{}).items():
            new_cost = curr_cost+ cost
            if neighbour not in cost_so_far or new_cost < cost_so_far[neighbour]:
                cost_so_far[neighbour] = new_cost
                came_from[neighbour] = node
                heapq.heappush(frontier,(new_cost,neighbour))

    # frontier = [(0,start)]
    # visited = []
    # cost_so_far = {start:0}
    # came_from = {start:None}

    # while frontier:
    #     cost,node = heapq.heappop(frontier)
    #     print(node, cost)
       
    #     if node in visited:
    #         continue
    #     visited.append(node)
    #     if node == goal:
    #         path = []
    #         while node is not None:
    #             path.append(node)
    #             node = came_from[node]

    #         print(path)

    #     for neighbour, curr_cost in graph.get(node, {}).items():
    #         new_cost = curr_cost + cost
    #         if neighbour not in cost_so_far or new_cost< cost_so_far[neighbour]:
    #             cost_so_far[neighbour] = new_cost
    #             came_from[neighbour] = node
    #             heapq.heappush(frontier,(new_cost,neighbour))


start = "A"
goal = "I"
ucs(start,goal,graph)