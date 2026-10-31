// rule-based AI engine
const DATASET = {
  "Arrays": {
    basic: { definition: "An Array is a collection of items stored at contiguous memory locations.", example: "Like a row of numbered lockers.", keyPoints: ["Fixed size", "Fast access via index O(1)", "Contiguous memory"] },
    intermediate: { definition: "Arrays allow random access of elements, making reads very fast, but insertions and deletions can be slow.", example: "int arr[5] = {1, 2, 3, 4, 5};", keyPoints: ["O(n) insertion/deletion at arbitrary positions", "Cache friendly", "Static vs Dynamic arrays"] },
    advanced: { definition: "At a low level, array elements are accessed via pointer arithmetic: address = base_address + (index * element_size).", example: "Dynamic arrays (like C++ vector) resize automatically by allocating double the current capacity.", keyPoints: ["Amortized O(1) appending", "Memory fragmentation issues", "Multidimensional array row-major vs column-major order"] },
    think: "Why is inserting an element at the beginning of an array slower than inserting it at the end?",
    nextTopics: ["Stack", "Queue", "Sorting Algorithms"]
  },
  "Trees": {
    basic: { definition: "A tree is a hierarchical data structure consisting of nodes connected by edges.", example: "Like a family tree or a company's organizational chart.", keyPoints: ["Has a root node", "Parent and child nodes", "No cycles"] },
    intermediate: { definition: "Binary trees restrict nodes to at most two children. Binary Search Trees (BST) keep the left child smaller and right child larger.", example: "File systems in operating systems.", keyPoints: ["O(log n) search on average", "Inorder, preorder, postorder traversals"] },
    advanced: { definition: "Self-balancing trees like AVL or Red-Black trees guarantee O(log n) operations by performing rotations after insertions/deletions.", example: "Database indexing (B-Trees) and 3D rendering (BSP trees).", keyPoints: ["Rotations to maintain balance factor", "B-Trees reduce disk I/O", "Trie variants for string matching"] },
    think: "If a binary search tree is highly unbalanced (looks like a linked list), what happens to its search time complexity?",
    nextTopics: ["Graphs", "Sorting Algorithms"]
  },
  "Stack": {
    basic: { definition: "A Stack is a linear data structure that follows the Last In, First Out (LIFO) principle.", example: "A stack of plates in a cafeteria. You only take from the top.", keyPoints: ["LIFO", "Push (add)", "Pop (remove)"] },
    intermediate: { definition: "Stacks can be implemented using arrays or linked lists. They are fundamental for tracking state changes.", example: "The 'Undo' feature in your text editor.", keyPoints: ["O(1) push and pop", "Detecting balanced parentheses", "Expression evaluation"] },
    advanced: { definition: "The call stack in a computer program stores active subroutines, tracking local variables and return addresses.", example: "Depth-First Search (DFS) algorithm uses a stack implicitly via recursion or explicitly.", keyPoints: ["Stack overflow", "Interrupt handling", "Register windows"] },
    think: "Why does recursive code sometimes cause a 'Stack Overflow' error?",
    nextTopics: ["Queue", "Trees"]
  },
  "Queue": {
    basic: { definition: "A Queue is a linear data structure following the First In, First Out (FIFO) principle.", example: "A line of people waiting for a ticket.", keyPoints: ["FIFO", "Enqueue (add to back)", "Dequeue (remove from front)"] },
    intermediate: { definition: "Queues are used to manage shared resources efficiently and keep things in order of arrival.", example: "Printer job queues or CPU task scheduling.", keyPoints: ["O(1) enqueue/dequeue", "Circular Queues", "Priority Queues"] },
    advanced: { definition: "Advanced queuing involves double-ended queues (Deques) or message brokers in distributed systems.", example: "Breadth-First Search (BFS) algorithm uses a queue.", keyPoints: ["Kafka/RabbitMQ message queues", "Blocking queues in multithreading", "Amortized analysis"] },
    think: "Imagine a printer queue. What happens if we switch it to LIFO instead of FIFO?",
    nextTopics: ["Stack", "Operating Systems"]
  },
  "Graphs": {
    basic: { definition: "A Graph is a set of vertices (nodes) connected by edges (links).", example: "A map of cities connected by highways.", keyPoints: ["Nodes and edges", "Can have cycles", "Directed or Undirected"] },
    intermediate: { definition: "Graphs model pair-wise relations. They can be represented using Adjacency Matrices or Adjacency Lists.", example: "Social networks (Facebook friends).", keyPoints: ["DFS and BFS traversals", "Weighted vs Unweighted edges", "Pathfinding"] },
    advanced: { definition: "Complex graph problems involve finding the shortest path (Dijkstra's) or minimum spanning tree (Kruskal's/Prim's).", example: "Google Maps routing algorithm.", keyPoints: ["Dijkstra's O((V+E)logV)", "Topological sorting", "Network flow algorithms"] },
    think: "How would you use a graph structure to find the shortest route between two cities?",
    nextTopics: ["Trees", "Sorting Algorithms"]
  },
  "Sorting Algorithms": {
    basic: { definition: "Sorting algorithms rearrange elements in a list into a specific order (like ascending or descending).", example: "Sorting a hand of playing cards from lowest to highest.", keyPoints: ["Organizes data", "Makes searching faster", "Various methods exist"] },
    intermediate: { definition: "Common algorithms include Bubble Sort, Merge Sort, and Quick Sort. They vary heavily in efficiency.", example: "Merge Sort recursively splits data in half, sorts, and merges.", keyPoints: ["Time complexity differences", "O(n^2) vs O(n log n)", "Stable vs Unstable sorting"] },
    advanced: { definition: "Quick Sort uses a pivot and partitioning. Though O(n^2) worst case, its cache locality makes it faster in practice than Merge Sort.", example: "Timsort is a hybrid sorting algorithm used in Python and Java's standard libraries.", keyPoints: ["Space complexity trade-offs", "In-place sorting", "Master Theorem for divide-and-conquer"] },
    think: "Why wouldn't you always use the fastest sorting algorithm like Quick Sort for every situation?",
    nextTopics: ["Arrays", "Trees"]
  },
  "DBMS": {
    basic: { definition: "A Database Management System (DBMS) is software for storing, retrieving, and managing data.", example: "A digital filing cabinet for a school's student records.", keyPoints: ["Stores data safely", "Fast retrieval", "SQL vs NoSQL"] },
    intermediate: { definition: "Relational DBMS (RDBMS) organizes data into tables with predefined schemas and uses SQL.", example: "MySQL or PostgreSQL handling user accounts for a website.", keyPoints: ["Tables, Rows, Columns", "Primary and Foreign keys", "ACID properties"] },
    advanced: { definition: "Scaling databases involves indexing, sharding, and replication. ACID properties ensure transaction safety.", example: "B-Tree indexes speed up row lookups from O(N) to O(log N).", keyPoints: ["Isolation levels", "Query execution plans", "CAP Theorem in distributed DBs"] },
    think: "If a bank transfers money between two accounts, why must this action be 'Atomic' (either entirely succeeds or entirely fails)?",
    nextTopics: ["Operating Systems", "Arrays"]
  },
  "Operating Systems": {
    basic: { definition: "An OS is system software that manages computer hardware and software resources.", example: "Windows, macOS, or Android on your phone.", keyPoints: ["Manages memory", "Controls hardware", "Provides user interface"] },
    intermediate: { definition: "The OS handles process scheduling, file management, and memory allocation to allow multitasking.", example: "Allocating CPU time to your web browser and music player simultaneously.", keyPoints: ["Processes and Threads", "Virtual Memory", "Context Switching"] },
    advanced: { definition: "Kernel space vs User space separation ensures security. Concepts like semaphores prevent race conditions.", example: "Paging algorithms (LRU) swap memory pages to disk when RAM is full.", keyPoints: ["Deadlock prevention", "Mutexes and Semaphores", "System calls"] },
    think: "What would happen if an Operating System didn't separate User memory from Kernel memory?",
    nextTopics: ["DBMS", "Neural Networks"]
  },
  "Neural Networks": {
    basic: { definition: "A computing system inspired by the human brain that learns to perform tasks by considering examples.", example: "A system learning to recognize images of cats.", keyPoints: ["Artificial neurons", "Layers", "Learns from data"] },
    intermediate: { definition: "Consists of an input layer, hidden layers, and an output layer. Weights are adjusted during training.", example: "Predicting house prices based on historical data.", keyPoints: ["Activation functions", "Feedforward", "Backpropagation"] },
    advanced: { definition: "Deep learning involves many hidden layers. Convolutional NNs (CNNs) handle images, while Recurrent NNs (RNNs) handle sequences.", example: "Large Language Models like GPT predicting the next word in a sequence.", keyPoints: ["Gradient descent optimizations", "Overfitting and Dropout", "Transformers architecture"] },
    think: "Why does a Neural Network need thousands of examples to learn something a human might learn from just one example?",
    nextTopics: ["Graphs", "DBMS"]
  }
};

const QUIZZES = {
  "Arrays": [
    { q: "What is the time complexity to access an element in an array by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: "O(1)", exp: "Arrays are contiguous in memory, allowing instant mathematical address calculation." },
    { q: "Which of these is a disadvantage of a static array?", options: ["Fast read access", "Fixed capacity", "Memory efficiency", "Cache friendliness"], correct: "Fixed capacity", exp: "Static arrays cannot grow dynamically once allocated." },
    { q: "How are multidimensional arrays typically stored in memory in C?", options: ["Random locations", "Column-major order", "Row-major order", "Linked lists"], correct: "Row-major order", exp: "C stores arrays sequentially row by row." }
  ],
  "Trees": [
    { q: "What is the top node of a tree called?", options: ["Leaf", "Root", "Branch", "Stem"], correct: "Root", exp: "The topmost node is the Root, from which all other nodes descend." },
    { q: "In a Binary Search Tree (BST), where is a smaller inserted value placed relative to the root?", options: ["Left child", "Right child", "Parent", "Sibling"], correct: "Left child", exp: "BST property: Left children are smaller, right children are larger." },
    { q: "What is the time complexity of searching in a perfectly balanced BST?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correct: "O(log n)", exp: "Each step cuts the search space in half." }
  ],
  "Stack": [
    { q: "Which principle does a Stack follow?", options: ["FIFO", "LIFO", "Random Access", "LILO"], correct: "LIFO", exp: "Last-In, First-Out (LIFO) ensures the most recently added item is handled first." },
    { q: "Which operation removes an element from the Stack?", options: ["Push", "Insert", "Pop", "Delete"], correct: "Pop", exp: "Pop removes the item at the top of the stack." },
    { q: "What error occurs if you try to add to a full stack?", options: ["Stack Underflow", "Memory Leak", "Stack Overflow", "Segmentation Fault"], correct: "Stack Overflow", exp: "Stack Overflow occurs when exceeding the stack's fixed memory capacity." }
  ],
  "Queue": [
    { q: "Which principle does a Queue follow?", options: ["LIFO", "FIFO", "FILO", "Random"], correct: "FIFO", exp: "First-In, First-Out (FIFO) ensures the oldest item is handled first." },
    { q: "Where do we add new elements in a standard Queue?", options: ["The front", "The middle", "The back (rear)", "Anywhere"], correct: "The back (rear)", exp: "Elements are enqueued at the back." },
    { q: "Which algorithm heavily utilizes a Queue?", options: ["Depth-First Search", "Binary Search", "Breadth-First Search", "Merge Sort"], correct: "Breadth-First Search", exp: "BFS processes nodes level by level, which naturally requires a queue." }
  ],
  "Graphs": [
    { q: "What do we call the connections between nodes in a graph?", options: ["Vertices", "Points", "Edges", "Intersections"], correct: "Edges", exp: "Edges (or links) connect vertices together." },
    { q: "If you can travel in only one direction between two nodes, the graph is:", options: ["Undirected", "Directed", "Weighted", "Cyclic"], correct: "Directed", exp: "Directed graphs restrict movement to the direction of the edge arrows." },
    { q: "Dijkstra's algorithm is used to find:", options: ["Max flow", "Shortest path", "Minimum Spanning Tree", "Cycles"], correct: "Shortest path", exp: "Dijkstra calculates the shortest path from a source to all other nodes in a weighted graph." }
  ],
  "Sorting Algorithms": [
    { q: "Which sorting algorithm is arguably the simplest but generally very slow?", options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Radix Sort"], correct: "Bubble Sort", exp: "Bubble sort repeatedly swaps adjacent elements, making it O(n^2) and slow." },
    { q: "What is the average time complexity of Merge Sort?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"], correct: "O(n log n)", exp: "Merge sort continually splits the array and merges with logarithmic depth." },
    { q: "A sorting algorithm is 'stable' if:", options: ["It never crashes", "It uses O(1) space", "Equal elements retain their original relative order", "It works fast on already sorted arrays"], correct: "Equal elements retain their original relative order", exp: "Stability ensures that identical keys are not swapped unnecessarily." }
  ],
  "DBMS": [
    { q: "What does SQL stand for?", options: ["System Query Language", "Structured Query Language", "Simple Question Logic", "Standard Query Linguistics"], correct: "Structured Query Language", exp: "SQL is the standard language for dealing with Relational Databases." },
    { q: "Which ACID property guarantees that a transaction is either fully completed or not executed at all?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], correct: "Atomicity", exp: "Atomicity ensures all-or-nothing execution." },
    { q: "A Foreign Key is used to:", options: ["Encrypt tables", "Ensure uniqueness", "Link two tables together", "Index quickly"], correct: "Link two tables together", exp: "Foreign keys reference primary keys in other tables to establish relationships." }
  ],
  "Operating Systems": [
    { q: "What is the core component of an Operating System called?", options: ["Shell", "Terminal", "Kernel", "GUI"], correct: "Kernel", exp: "The kernel sits between the hardware and software layers." },
    { q: "What issue arises when two processes are waiting on each other indefinitely?", options: ["Starvation", "Deadlock", "Segmentation Fault", "Thrashing"], correct: "Deadlock", exp: "Deadlocks happen when processes have cyclic dependencies on locked resources." },
    { q: "Virtual Memory uses what hardware component as an extension of RAM?", options: ["CPU Cache", "Hard Disk/SSD", "GPU", "Network Card"], correct: "Hard Disk/SSD", exp: "Virtual memory pages out inactive RAM blocks to disk drives." }
  ],
  "Neural Networks": [
    { q: "What algorithm is primarily used to adjust weights in a Neural Network?", options: ["Dijkstra's", "Backpropagation", "Merge Sort", "K-Means"], correct: "Backpropagation", exp: "Backpropagation calculates errors backwards to update weights via gradient descent." },
    { q: "Which layer type is mainly used in CNNs for image processing?", options: ["Recurrent", "Dense", "Convolutional", "Dropout"], correct: "Convolutional", exp: "Convolutional layers apply filters to extract spatial features from images." },
    { q: "What problem occurs when a model learns the training data too well but fails on new data?", options: ["Underfitting", "Vanishing Gradient", "Overfitting", "Convergence"], correct: "Overfitting", exp: "Overfitting means the model memorized noise rather than generalizing." }
  ]
};

// Simple chat dictionary matching for non-specific topics
const FALLBACK_RESPONSES = [
  "I am specifically trained as a strict academic prototype for advanced CS concepts. Please select a valid module topic and mode from the interface.",
  "That is an interesting thought! However, to maximize our prototype session, please select a topic from the dropdown.",
  "Hmm, I cannot process free text outside the predefined topics at this moment. Try utilizing the Learn, Think, or Understand modules.",
  "My rule-based logic is restrained to the 9 core CS paths explicitly outlined. Please choose one of those."
];

function generateResponse(topic, moduleType, level, message, history) {
  if (!DATASET[topic]) {
    // Fallback logic
    return {
      type: "text",
      content: "I'm still learning. Try selecting a topic from Learn module." 
    };
  }

  const topicData = DATASET[topic];
  
  if (moduleType === "understand") {
    // Give quiz mode instructions or the entire quiz.
    return {
      type: "text",
      content: `The Understand module is meant to test your knowledge. Please use the Quiz endpoint or select generated quizzes regarding ${topic}.` 
    };
  }

  if (moduleType === "think") {
    return {
      type: "think",
      content: topicData.think,
      nextTopics: topicData.nextTopics
    };
  }

  if (moduleType === "workspace") {
    const hint = topicData.basic.definition;
    const kp = topicData.basic.keyPoints[0] || "its fundamental structure";
    const msgCount = history ? history.length : 0;
    
    // We offer a guided response step-by-step
    let htmlWorkspace = "";
    if (msgCount > 3) {
      htmlWorkspace = `
        <div style="font-family:inherit;">
          <p>Great! You are thinking in the right direction. Let me explain fully.</p>
          <p><b>Deeper Dive:</b> ${topicData.intermediate.definition}</p>
          <p><b>For example:</b> ${topicData.intermediate.example}</p>
          <p><b>Key takeaways:</b></p>
          <ul style="padding-left: 20px;">
            ${topicData.intermediate.keyPoints.map(k=>`<li>${k}</li>`).join('')}
          </ul>
          <p style="margin-top:10px; font-weight:600; font-size: 0.9em; color: var(--color-primary);">Recommended Next: ${topicData.nextTopics.join(" \u2022 ")}</p>
        </div>
      `;
    } else {
      htmlWorkspace = `
        <div style="font-family:inherit;">
          <p>Let's take this step-by-step. Before giving you the complete answer, consider this hint:</p>
          <blockquote style="border-left: 3px solid var(--color-primary); padding-left: 10px; color: var(--color-text-muted); font-style: italic;">
            Instead of thinking about all of ${topic}, let's focus on ${kp}.
          </blockquote>
          <p>A basic definition to get you started: <i>${hint}</i></p>
          <p style="margin-top:10px;"><b>What are your thoughts on this? Can you give an example of how you might use it?</b></p>
        </div>
      `;
    }

    return {
      type: "html",
      content: htmlWorkspace,
      nextTopics: topicData.nextTopics
    };
  }

  // default to learn
  const contentLevel = topicData[level] || topicData["basic"];
  const html = `
    <div style="font-family:inherit;">
      <h3 style="margin-top:0;">What is it?</h3>
      <p>${contentLevel.definition}</p>
      
      <h3>Example</h3>
      <p>${contentLevel.example}</p>
      
      <h3>Key Points</h3>
      <ul style="padding-left: 20px;">
        ${contentLevel.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
      </ul>
      
      <p style="margin-top:20px; font-weight:600; font-size: 0.9em; color: var(--color-primary);">Recommended Next: ${topicData.nextTopics.join(" \u2022 ")}</p>
    </div>
  `;

  return {
    type: "html",
    content: html,
    nextTopics: topicData.nextTopics
  };
}

module.exports = {
  DATASET,
  QUIZZES,
  generateResponse
};
