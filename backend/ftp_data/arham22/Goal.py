class GoalBasedAgent:
    def __init__(self, goal):
        self.goal = goal

    def formulate_goal(self,percept):
        if percept == self.goal:
            return "Goal Found"
        else:
            return "Searching"

    def dls_search(self,percept,graph,goal,depth_max):
        visited= []
        def dfs(node, depth):
            if depth > depth_max:
                return None
            visited.append(node)
            if node == goal:
                return "Goal found"
            
            for neighbour in graph.get(node,[]):
                if neighbour not in visited:
                    path = dfs(neighbour,depth+1)
                    if path:
                        return path
                
            visited.pop()
            return None
        
        return dfs(percept,0)


    
    
    def act(self, percept, graph, depth_max):
        status = self.formulate_goal(percept)
        if status == "Goal Found":
            return "GOAL FOUND"
        else:
            return self.dls_search(percept,graph,self.goal,depth_max)

    
  




class Environment:
    def __init__(self,graph):
        self.graph = graph

    def get_percept(self, node):
        return node
    
graph = {

"A":["B","C"],
"B":["D"],
"C":["E"],
"D": [],
"E":["F"],
"F":[]


}

def run_agent(agent,env,start,depth_max):
    percept = env.get_percept(start)
    action = agent.act(percept,env.graph,depth_max)
    print(action)


agent = GoalBasedAgent("F")
env = Environment(graph)
run_agent(agent,env,"A",3)
