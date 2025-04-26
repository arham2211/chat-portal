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

def dls(node,goal,depth,path):
    if depth == 0:
        return False
    if node == goal:
        return True
    
    for neighbour in tree.get(node,{}):
        if dls(neighbour,goal,depth-1,path):
            path.append(node)
            return True
        
    return False

#     if depth == 0: 
#         return False
#     if node == goal:
#         path.append(node)
#         return True
    
#     for neighbour in tree[node]:
#         if dls(neighbour,goal,depth-1,tree,path):
#             path.append(node)
#             return True
#     return False

def ids(start,goal,max_depth):
    for i in range(max_depth+1):
        path = []
        if dls(start,goal,i,path):
            print(path)
    # for i in range(max_depth+1):
    #     path = []
    #     if dls(start,goal,i,tree,path):
    #         print(path[::-1])
    #         return

start = "A"
goal = "I"
max_depth = 5

ids(tree,start,goal,max_depth)