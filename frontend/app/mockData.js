/**
 * Mock data for prototype — no backend.
 */

export const mockClasses = [
  {
    id: "c1",
    code: "CS101",
    name: "Intro to AI",
    lecturer: "Dr. Aisha Khan",
    description: "Foundations of intelligent systems, from search to supervised learning.",
    progress: 68,
  },
  {
    id: "c2",
    code: "MATH204",
    name: "Linear Algebra",
    lecturer: "Prof. Daniel Okafor",
    description: "Vectors, matrices, and eigen-stuff that power modern ML.",
    progress: 42,
  },
  {
    id: "c3",
    code: "ENG115",
    name: "Academic Writing",
    lecturer: "Dr. Mei Tan",
    description: "Clear, structured writing for academic assignments and reports.",
    progress: 81,
  },
];

/** Subject → topics for lecturer Create Class (dropdown filter) */
export const SUBJECT_TOPICS_MAP = {
  "Data Structures": ["Arrays", "Linked List", "Stack", "Queue", "Trees", "Graphs"],
  DBMS: ["ER Model", "SQL", "Normalization", "Transactions"],
  "Computer Science": ["Programming Fundamentals", "Algorithms", "Operating Systems", "Networks"],
  "Machine Learning": ["Supervised Learning", "Neural Networks", "Evaluation", "Deployment"],
};

export const mockTopics = [
  {
    id: "t1",
    title: "Introduction to Machine Learning",
    body:
      "Machine learning focuses on building models that can learn patterns from data and make predictions or decisions without being explicitly programmed for each rule. In this module, you will connect concepts to real datasets and reflect on how models generalize.",
  },
  {
    id: "t2",
    title: "Linear Regression",
    body:
      "Linear regression models the relationship between input features and a continuous target using a straight line, optimized to minimize prediction error.",
  },
  {
    id: "t3",
    title: "Classification Basics",
    body:
      "Classification algorithms assign inputs to discrete categories, such as spam vs. non-spam, using decision boundaries learned from labeled data.",
  },
  {
    id: "t4",
    title: "Evaluation Metrics",
    body:
      "Evaluation metrics such as accuracy, precision, recall, and F1-score help you understand how well a model performs beyond a single number.",
  },
];

export const mockQuizQuestions = [
  {
    id: "q1",
    text: "Which statement best describes supervised learning?",
    options: {
      a: "Learning patterns from unlabeled data without a target.",
      b: "Learning from labeled examples to predict outputs for new inputs.",
      c: "Learning solely through trial-and-error rewards.",
      d: "Hard-coding rules instead of learning from data.",
    },
    correct: "b",
  },
  {
    id: "q2",
    text: "What is the main goal of a regression model?",
    options: {
      a: "Assign inputs to discrete categories.",
      b: "Generate realistic synthetic data.",
      c: "Predict a continuous numerical value.",
      d: "Compress data into a lower dimension.",
    },
    correct: "c",
  },
  {
    id: "q3",
    text: "Which metric is most appropriate for imbalanced classification?",
    options: {
      a: "Accuracy",
      b: "Precision and recall",
      c: "Mean squared error",
      d: "R-squared",
    },
    correct: "b",
  },
];

export const mockLecturerStats = {
  totalStudents: 248,
  averageScore: 78,
  weakTopics: 5,
  activeClasses: 12,
};

export const mockAnalyticsScores = [72, 75, 78, 74, 80, 82];

export const mockWeakTopics = [
  { name: "Evaluation metrics", subtitle: "Accuracy vs. precision/recall", level: "High" },
  { name: "Overfitting", subtitle: "Bias-variance tradeoff", level: "Medium" },
  { name: "Feature scaling", subtitle: "Normalization vs. standardization", level: "Medium" },
];

export const mockClassDetails = {
  c1: {
    deadline: "2025-12-15",
    topics: [
      { id: "c1-t1", title: "Search & Problem Solving", description: "Formulating AI problems and exploring state spaces." },
      { id: "c1-t2", title: "Supervised Learning", description: "From data to models: training, validation, and testing." },
      { id: "c1-t3", title: "Model Evaluation", description: "Understanding accuracy, precision/recall, and F1." },
    ],
    materials: [
      { id: "m1", title: "Intro to AI – Week 1 Slides", type: "PDF" },
      { id: "m2", title: "Supervised Learning Cheat Sheet", type: "PDF" },
      { id: "m3", title: "Andrew Ng – Coursera ML", type: "Link" },
    ],
    assessments: [
      { id: "a1", title: "Quiz 1: Search Basics", topic: "Search & Problem Solving" },
      { id: "a2", title: "Quiz 2: Supervised Learning", topic: "Supervised Learning" },
      { id: "a3", title: "Quiz 3: Evaluation Metrics", topic: "Model Evaluation" },
      { id: "final", title: "Final Assessment", topic: "Whole course" },
    ],
    analytics: {
      scores: [
        { id: "a1", title: "Quiz 1: Search Basics", score: 78 },
        { id: "a2", title: "Quiz 2: Supervised Learning", score: 64 },
        { id: "a3", title: "Quiz 3: Evaluation Metrics", score: 52 },
      ],
      topicsCompleted: 2,
      totalTopics: 3,
      assessmentsCompleted: 1,
      totalAssessments: 4,
    },
  },
  c2: {
    deadline: "2025-11-30",
    topics: [
      { id: "c2-t1", title: "Vectors & Matrices", description: "Core algebra objects and operations." },
      { id: "c2-t2", title: "Matrix Decompositions", description: "Eigenvalues, eigenvectors, and diagonalization." },
    ],
    materials: [
      { id: "m1", title: "Lecture Notes – Linear Algebra Essentials", type: "PDF" },
      { id: "m2", title: "3Blue1Brown – Essence of Linear Algebra", type: "Link" },
    ],
    assessments: [
      { id: "a1", title: "Assignment 1: Vectors", topic: "Vectors & Matrices" },
      { id: "a2", title: "Assignment 2: Eigenvalues", topic: "Matrix Decompositions" },
      { id: "final", title: "Final Assessment", topic: "Whole course" },
    ],
    analytics: {
      scores: [
        { id: "a1", title: "Assignment 1: Vectors", score: 88 },
        { id: "a2", title: "Assignment 2: Eigenvalues", score: 72 },
      ],
      topicsCompleted: 1,
      totalTopics: 2,
      assessmentsCompleted: 1,
      totalAssessments: 3,
    },
  },
  c3: {
    deadline: "2025-10-20",
    topics: [
      { id: "c3-t1", title: "Thesis Statements", description: "Writing clear, arguable thesis statements." },
      { id: "c3-t2", title: "Structuring Paragraphs", description: "Topic sentences, evidence, and cohesion." },
    ],
    materials: [
      { id: "m1", title: "Sample Essays (PDF)", type: "PDF" },
      { id: "m2", title: "Academic Style Guide", type: "Document" },
    ],
    assessments: [
      { id: "a1", title: "Essay Plan Submission", topic: "Thesis Statements" },
      { id: "a2", title: "Draft Review", topic: "Structuring Paragraphs" },
      { id: "final", title: "Final Essay", topic: "Whole course" },
    ],
    analytics: {
      scores: [
        { id: "a1", title: "Essay Plan Submission", score: 70 },
        { id: "a2", title: "Draft Review", score: 65 },
      ],
      topicsCompleted: 1,
      totalTopics: 2,
      assessmentsCompleted: 0,
      totalAssessments: 3,
    },
  },
};

export const AI_KNOWLEDGE = {
  "Arrays": {
    keywords: ["array", "arrays", "index", "list", "elements", "contiguous"],
    responses: [
      "Arrays store elements in contiguous memory locations. Using an array allows giving a single name to an entire collection instead of declaring lots of individual variables.",
      "An array is like a row of mailboxes, each with an index. You can quickly look up any mailbox if you know its number. Tip: Arrays provide O(1) time complexity for random access.",
      "Arrays are simple lists of items of the same type stored together. Example: storing the grades of 50 students in memory consecutively. Would you like an example of how to declare one?"
    ],
    quiz: [
      { text: "What is an array?", options: { a: "A non-linear data structure", b: "A collection of items stored at contiguous memory locations", c: "A graph structure used to map relationships", d: "A Last-In-First-Out data structure" }, correct: "b" },
      { text: "How do you typically access elements in an array?", options: { a: "Using a pointer to the next node", b: "Through a hashing function", c: "By their index or position", d: "By traversing from the root" }, correct: "c" },
      { text: "What is the primary advantage of an array?", options: { a: "Fast insertion anywhere", b: "Dynamic size allocation", c: "Fast, O(1) random access", d: "Automatic sorting" }, correct: "c" },
      { text: "Which scenario is best suited for an array?", options: { a: "Frequently adding elements in the middle", b: "Storing a fixed number of homogeneous elements", c: "Representing a hierarchical relationship", d: "Processing items strictly sequentially like a pipeline" }, correct: "b" },
      { text: "What happens if you try to access an index outside the valid range of an array?", options: { a: "The array automatically expands", b: "It loops back to the beginning", c: "It throws an index out of bounds error", d: "It creates a new array" }, correct: "c" }
    ]
  },
  "Trees": {
    keywords: ["tree", "trees", "node", "binary", "root", "leaf", "hierarchical"],
    responses: [
      "A tree is a hierarchical data structure consisting of nodes, with a single root node. Example: A family tree or file system.",
      "In a tree, each node can have multiple children. Unlike arrays, trees are non-linear. Tip: Binary trees are trees where each node has at most two children.",
      "Trees are fantastic for representing hierarchical relationships. A great example is the DOM (Document Object Model) structure of a webpage, or the folder structure on your computer."
    ],
    quiz: [
      { text: "What is the topmost node of a tree called?", options: { a: "Leaf", b: "Root", c: "Branch", d: "Edge" }, correct: "b" },
      { text: "Which of these is a non-linear data structure?", options: { a: "Array", b: "Linked List", c: "Queue", d: "Tree" }, correct: "d" },
      { text: "What are nodes with no children called?", options: { a: "Parent nodes", b: "Orphan nodes", c: "Leaf nodes", d: "Internal nodes" }, correct: "c" },
      { text: "What characterizes a binary tree?", options: { a: "Each node can have any number of children", b: "Each node has exactly one child", c: "Each node can have at most two children", d: "Nodes store binary data (0s and 1s)" }, correct: "c" },
      { text: "Which traversal method visits children before their parent?", options: { a: "Pre-order", b: "In-order", c: "Post-order", d: "Level-order" }, correct: "c" }
    ]
  },
  "Neural Networks": {
    keywords: ["neural", "network", "deep learning", "layers", "neuron", "weights", "ai"],
    responses: [
      "Neural Networks are computing systems loosely inspired by biological brains, organized in layers: an input layer, hidden layers, and an output layer.",
      "Deep learning utilizes neural networks with many hidden layers. Example: Image recognition uses deep neural networks where each layer detects more complex features (from edges to faces).",
      "During training, a neural network adjusts its 'weights' to map inputs to correct outputs. Tip: A learning rate controls how quickly these weights are updated."
    ],
    quiz: [
      { text: "What are the primary building blocks of neural networks?", options: { a: "Neurons/Nodes", b: "Trees", c: "SQL statements", d: "Arrays" }, correct: "a" },
      { text: "What is the function of the hidden layers?", options: { a: "To store the final output safely", b: "To perform intermediate computations and extract features", c: "To display network architecture", d: "To load data from the disk" }, correct: "b" },
      { text: "What gets adjusted during the training of a neural network?", options: { a: "The number of layers", b: "The type of data", c: "The weights and biases", d: "The CPU speed" }, correct: "c" },
      { text: "Which of the following is commonly used to train neural networks?", options: { a: "Bubble sort", b: "Backpropagation", c: "Binary search", d: "Dijkstra's algorithm" }, correct: "b" },
      { text: "What does 'deep' refer to in Deep Learning?", options: { a: "The profound philosophical intelligence", b: "The physical depth of the server racks", c: "The number of hidden layers in the network", d: "The time it takes to train" }, correct: "c" }
    ]
  }
};
