grid = [
    [1, 1, 1, 1, 1],
    [1, 'S', 0, 'E', 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
]

def isValid(grid,visited, row, col):
    if row < 0 or col >=5 or row >= 5 or col < 0:
        return False
    if visited[row][col]:
        return False
    if grid[row][col] == 1:
        return False
    return True


def bfs(grid,start,goal):
    queue = []
    visited = [[False for _ in range(5)] for _ in range(5)]
    queue.append((start))
    x, y = start
    visited[x][y] = True
    while queue:
        node = queue.pop(0)
        x , y = node
        if node == goal:
            print("Goal Found", visited)
            return
        
        directions = [(1,0),(0,1),(-1,0),(0,-1)]
        for i in range(len(directions)):
            dx , dy = directions[i]
            newX = dx + x
            newY = dy + y
            if(isValid(grid,visited, newX, newY)):
                queue.append((newX,newY))
                visited[newX][newY] = True
            




start = (1,1)
goal = (1,3)
bfs(grid,start,goal)


