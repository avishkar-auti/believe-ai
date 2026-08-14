import type { RoadmapResource } from "@believe-ai/shared";

/**
 * Curated, hand-verified official documentation home pages. Deliberately
 * static rather than fetched/guessed — every entry here is a real, stable
 * canonical URL. Keys are matched against roadmap stage titles/topics via
 * normalizeTopic() + substring matching, so "Docker" and "Docker & Compose"
 * both resolve to the same entry.
 */
const DOC_MAP: Record<string, { title: string; url: string }> = {
  linux: { title: "Linux Documentation Project", url: "https://tldp.org/" },
  bash: { title: "GNU Bash Manual", url: "https://www.gnu.org/software/bash/manual/bash.html" },
  git: { title: "Git Documentation", url: "https://git-scm.com/doc" },
  github: { title: "GitHub Docs", url: "https://docs.github.com/" },
  docker: { title: "Docker Docs", url: "https://docs.docker.com/" },
  kubernetes: { title: "Kubernetes Documentation", url: "https://kubernetes.io/docs/home/" },
  k8s: { title: "Kubernetes Documentation", url: "https://kubernetes.io/docs/home/" },
  helm: { title: "Helm Docs", url: "https://helm.sh/docs/" },
  terraform: { title: "Terraform Documentation", url: "https://developer.hashicorp.com/terraform/docs" },
  ansible: { title: "Ansible Documentation", url: "https://docs.ansible.com/" },
  jenkins: { title: "Jenkins Documentation", url: "https://www.jenkins.io/doc/" },
  "ci/cd": { title: "GitHub Actions Documentation", url: "https://docs.github.com/en/actions" },
  prometheus: { title: "Prometheus Documentation", url: "https://prometheus.io/docs/introduction/overview/" },
  grafana: { title: "Grafana Documentation", url: "https://grafana.com/docs/" },
  nginx: { title: "NGINX Documentation", url: "https://nginx.org/en/docs/" },
  python: { title: "Python Documentation", url: "https://docs.python.org/3/" },
  java: { title: "Java Documentation", url: "https://docs.oracle.com/en/java/" },
  javascript: { title: "MDN JavaScript Docs", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  typescript: { title: "TypeScript Documentation", url: "https://www.typescriptlang.org/docs/" },
  html: { title: "MDN HTML Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
  css: { title: "MDN CSS Docs", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
  react: { title: "React Documentation", url: "https://react.dev/" },
  "node.js": { title: "Node.js Documentation", url: "https://nodejs.org/en/docs" },
  nodejs: { title: "Node.js Documentation", url: "https://nodejs.org/en/docs" },
  go: { title: "Go Documentation", url: "https://go.dev/doc/" },
  golang: { title: "Go Documentation", url: "https://go.dev/doc/" },
  rust: { title: "The Rust Programming Language", url: "https://doc.rust-lang.org/book/" },
  "c++": { title: "cppreference.com", url: "https://en.cppreference.com/w/" },
  kotlin: { title: "Kotlin Documentation", url: "https://kotlinlang.org/docs/home.html" },
  "spring boot": { title: "Spring Boot Documentation", url: "https://docs.spring.io/spring-boot/index.html" },
  django: { title: "Django Documentation", url: "https://docs.djangoproject.com/" },
  flask: { title: "Flask Documentation", url: "https://flask.palletsprojects.com/" },
  sql: { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/" },
  postgresql: { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/" },
  mysql: { title: "MySQL Documentation", url: "https://dev.mysql.com/doc/" },
  mongodb: { title: "MongoDB Documentation", url: "https://www.mongodb.com/docs/" },
  redis: { title: "Redis Documentation", url: "https://redis.io/docs/" },
  graphql: { title: "GraphQL Documentation", url: "https://graphql.org/learn/" },
  "rest api": { title: "MDN HTTP Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP" },
  aws: { title: "AWS Documentation", url: "https://docs.aws.amazon.com/" },
  azure: { title: "Microsoft Azure Documentation", url: "https://learn.microsoft.com/en-us/azure/" },
  gcp: { title: "Google Cloud Documentation", url: "https://cloud.google.com/docs" },
  "google cloud": { title: "Google Cloud Documentation", url: "https://cloud.google.com/docs" },
  "machine learning": { title: "scikit-learn User Guide", url: "https://scikit-learn.org/stable/user_guide.html" },
  tensorflow: { title: "TensorFlow Documentation", url: "https://www.tensorflow.org/learn" },
  pytorch: { title: "PyTorch Documentation", url: "https://pytorch.org/docs/stable/index.html" },
  pandas: { title: "pandas Documentation", url: "https://pandas.pydata.org/docs/" },
  numpy: { title: "NumPy Documentation", url: "https://numpy.org/doc/" },
  "system design": {
    title: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
  },
  microservices: { title: "Microsoft Microservices Architecture Guide", url: "https://learn.microsoft.com/en-us/azure/architecture/microservices/" },
  kafka: { title: "Apache Kafka Documentation", url: "https://kafka.apache.org/documentation/" },
  rabbitmq: { title: "RabbitMQ Documentation", url: "https://www.rabbitmq.com/docs" },
  grpc: { title: "gRPC Documentation", url: "https://grpc.io/docs/" },
  networking: { title: "MDN Networking Docs", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_web_server" },
  security: { title: "OWASP Top Ten", url: "https://owasp.org/www-project-top-ten/" },
};

const DOC_KEYS = Object.keys(DOC_MAP).sort((a, b) => b.length - a.length); // longest-first so "spring boot" beats "spring"

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

/** Returns a real, curated documentation resource for a roadmap topic — or null rather than guessing a link. */
export function findDocumentation(topic: string): RoadmapResource | null {
  const normalized = normalizeTopic(topic);
  const key = DOC_KEYS.find((k) => normalized.includes(k));
  if (!key) return null;

  const entry = DOC_MAP[key]!;
  return { title: entry.title, type: "documentation", url: entry.url };
}
