import random

# Function to be maximized
def fitness(x):
    return x**2 + x

# Generate a random 5-bit binary string
def generate_individual():
    return ''.join(random.choice('01') for _ in range(5))

# Convert binary string to integer
def binary_to_int(binary_str):
    return int(binary_str, 2)

# Selection using tournament selection
def select(population):
    tournament = random.sample(population, 3)
    return max(tournament, key=lambda ind: fitness(binary_to_int(ind)))

# Single-point crossover
def crossover(parent1, parent2):
    point = random.randint(1, 4)  # Single-point crossover (not at ends)
    child1 = parent1[:point] + parent2[point:]
    child2 = parent2[:point] + parent1[point:]
    return child1, child2

# Mutation (flip one bit randomly)
def mutate(individual, mutation_rate=0.1):
    if random.random() < mutation_rate:
        index = random.randint(0, 4)
        mutated = list(individual)
        mutated[index] = '1' if mutated[index] == '0' else '0'
        return ''.join(mutated)
    return individual

# Genetic Algorithm
def genetic_algorithm(pop_size=10, generations=50, mutation_rate=0.1):
    population = [generate_individual() for _ in range(pop_size)]
    print("population: ",population)
    
    for _ in range(generations):
        new_population = []
        for _ in range(pop_size // 2):  # Creating next generation
            parent1 = select(population)
            parent2 = select(population)
            child1, child2 = crossover(parent1, parent2)
            new_population.extend([mutate(child1, mutation_rate), mutate(child2, mutation_rate)])
        population = new_population
    
    best_individual = max(population, key=lambda ind: fitness(binary_to_int(ind)))
    best_x = binary_to_int(best_individual)
    best_fitness = fitness(best_x)
    return best_x, best_fitness

# Run GA
best_x, max_fitness = genetic_algorithm()
print(f"Best x: {best_x}, Maximum f(x): {max_fitness}")
