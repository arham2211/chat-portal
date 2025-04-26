
import random

def calculate_conflicts(state):
    print(state)  # Debugging: Print the current state
    conflicts = 0
    n = len(state)

    for i in range(n):
        for j in range(i + 1, n):
            # Check same column or diagonal
            if state[i] == state[j] or abs(state[i] - state[j]) == abs(i - j):
                conflicts += 1

    return conflicts

def get_neighbors(state):
    neighbors = []
    n = len(state)

    for row in range(n):
        for col in range(n):
            if col != state[row]:  # Avoid the current position
                new_state = list(state)
                new_state[row] = col
                neighbors.append(new_state)

    return neighbors

def simple_hill_climbing(n):
    # Random initial state
    current_state = [random.randint(0, n - 1) for _ in range(n)]
    current_conflicts = calculate_conflicts(current_state)
    print("Initial state:", current_state, "Conflicts:", current_conflicts)
    
    while True:
        neighbors = get_neighbors(current_state)
        print("Neighbours: ",neighbors)
        next_state = None
        next_conflicts = current_conflicts

        # Find the first better neighbor
        for neighbor in neighbors:
            neighbor_conflicts = calculate_conflicts(neighbor)
            if neighbor_conflicts < next_conflicts:
                next_state = neighbor
                next_conflicts = neighbor_conflicts
                break  # Move to the first better neighbor

        # If no better neighbor is found, return the current state
        if next_conflicts >= current_conflicts:
            break

        # Move to the better neighbor
        current_state = next_state
        current_conflicts = next_conflicts
    return current_state, current_conflicts

n = 4 # Change N here for different sizes
solution, conflicts = simple_hill_climbing(4)
# Print results
if conflicts == 0:
    print(f"Solution found for {n}-Queens problem:")
    print(solution)
else:
    print(f"Could not find a solution. Stuck at state with {conflicts} conflicts:")
    print(solution)


import random
import math


def distance(point1, point2):
    return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)

def total_distance(route):
    # return sum(distance(route[i], route[i + 1]) for i in range(len(route) - 1))
    sum = 0
    for i in range(len(route)-1):
        sum += distance(route[i],route[i+1])

    return sum

def get_neighbors(route):
    neighbors = []
    for i in range(len(route)):
        for j in range(i + 1, len(route)):
            neighbor = route.copy()
            neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
            neighbors.append(neighbor)
    return neighbors




def hill_climbing(delivery_points):


    current_route = delivery_points.copy()
    random.shuffle(current_route)
    current_distance = total_distance(current_route)
    print("Current Route:", current_route)
    print("Current Distance:", current_distance)

    while True:
        neighbors = get_neighbors(current_route)
        next_route = None
        next_distance = current_distance
        print("Neighbours: ",neighbors)

        for neighbor in neighbors:
            neighbor_distance = total_distance(neighbor)
            if neighbor_distance < next_distance:
                next_route = neighbor
                next_distance = neighbor_distance
                break

        if next_distance >= current_distance:
            break


        current_route = next_route
        current_distance = next_distance

    return current_route, current_distance


delivery_points = [(0, 0), (1, 5), (3, 2), (7, 8), (5, 3)]
optimized_route, total_distance = hill_climbing(delivery_points)

print("Optimized Route:", optimized_route)
print("Total Distance:", total_distance)