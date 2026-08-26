"""Roadmap's curated documentation lookup — mirrors apps/api's
documentationResources.ts. Deliberately static rather than fetched/guessed —
every entry here is a real, stable canonical URL. Keys are matched against
roadmap stage titles/topics via substring matching, longest key first, so
"Docker" and "Docker & Compose" both resolve to the same entry."""

from __future__ import annotations

from models.roadmap import RoadmapResource

_DOC_MAP: dict[str, tuple[str, str]] = {
    "linux": ("Linux Documentation Project", "https://tldp.org/"),
    "bash": ("GNU Bash Manual", "https://www.gnu.org/software/bash/manual/bash.html"),
    "git": ("Git Documentation", "https://git-scm.com/doc"),
    "github": ("GitHub Docs", "https://docs.github.com/"),
    "docker": ("Docker Docs", "https://docs.docker.com/"),
    "kubernetes": ("Kubernetes Documentation", "https://kubernetes.io/docs/home/"),
    "k8s": ("Kubernetes Documentation", "https://kubernetes.io/docs/home/"),
    "helm": ("Helm Docs", "https://helm.sh/docs/"),
    "terraform": ("Terraform Documentation", "https://developer.hashicorp.com/terraform/docs"),
    "ansible": ("Ansible Documentation", "https://docs.ansible.com/"),
    "jenkins": ("Jenkins Documentation", "https://www.jenkins.io/doc/"),
    "ci/cd": ("GitHub Actions Documentation", "https://docs.github.com/en/actions"),
    "prometheus": ("Prometheus Documentation", "https://prometheus.io/docs/introduction/overview/"),
    "grafana": ("Grafana Documentation", "https://grafana.com/docs/"),
    "nginx": ("NGINX Documentation", "https://nginx.org/en/docs/"),
    "python": ("Python Documentation", "https://docs.python.org/3/"),
    "java": ("Java Documentation", "https://docs.oracle.com/en/java/"),
    "javascript": ("MDN JavaScript Docs", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"),
    "typescript": ("TypeScript Documentation", "https://www.typescriptlang.org/docs/"),
    "html": ("MDN HTML Docs", "https://developer.mozilla.org/en-US/docs/Web/HTML"),
    "css": ("MDN CSS Docs", "https://developer.mozilla.org/en-US/docs/Web/CSS"),
    "react": ("React Documentation", "https://react.dev/"),
    "node.js": ("Node.js Documentation", "https://nodejs.org/en/docs"),
    "nodejs": ("Node.js Documentation", "https://nodejs.org/en/docs"),
    "go": ("Go Documentation", "https://go.dev/doc/"),
    "golang": ("Go Documentation", "https://go.dev/doc/"),
    "rust": ("The Rust Programming Language", "https://doc.rust-lang.org/book/"),
    "c++": ("cppreference.com", "https://en.cppreference.com/w/"),
    "kotlin": ("Kotlin Documentation", "https://kotlinlang.org/docs/home.html"),
    "spring boot": ("Spring Boot Documentation", "https://docs.spring.io/spring-boot/index.html"),
    "django": ("Django Documentation", "https://docs.djangoproject.com/"),
    "flask": ("Flask Documentation", "https://flask.palletsprojects.com/"),
    "sql": ("PostgreSQL Documentation", "https://www.postgresql.org/docs/"),
    "postgresql": ("PostgreSQL Documentation", "https://www.postgresql.org/docs/"),
    "mysql": ("MySQL Documentation", "https://dev.mysql.com/doc/"),
    "mongodb": ("MongoDB Documentation", "https://www.mongodb.com/docs/"),
    "redis": ("Redis Documentation", "https://redis.io/docs/"),
    "graphql": ("GraphQL Documentation", "https://graphql.org/learn/"),
    "rest api": ("MDN HTTP Docs", "https://developer.mozilla.org/en-US/docs/Web/HTTP"),
    "aws": ("AWS Documentation", "https://docs.aws.amazon.com/"),
    "azure": ("Microsoft Azure Documentation", "https://learn.microsoft.com/en-us/azure/"),
    "gcp": ("Google Cloud Documentation", "https://cloud.google.com/docs"),
    "google cloud": ("Google Cloud Documentation", "https://cloud.google.com/docs"),
    "machine learning": ("scikit-learn User Guide", "https://scikit-learn.org/stable/user_guide.html"),
    "tensorflow": ("TensorFlow Documentation", "https://www.tensorflow.org/learn"),
    "pytorch": ("PyTorch Documentation", "https://pytorch.org/docs/stable/index.html"),
    "pandas": ("pandas Documentation", "https://pandas.pydata.org/docs/"),
    "numpy": ("NumPy Documentation", "https://numpy.org/doc/"),
    "system design": ("System Design Primer", "https://github.com/donnemartin/system-design-primer"),
    "microservices": (
        "Microsoft Microservices Architecture Guide",
        "https://learn.microsoft.com/en-us/azure/architecture/microservices/",
    ),
    "kafka": ("Apache Kafka Documentation", "https://kafka.apache.org/documentation/"),
    "rabbitmq": ("RabbitMQ Documentation", "https://www.rabbitmq.com/docs"),
    "grpc": ("gRPC Documentation", "https://grpc.io/docs/"),
    "networking": (
        "MDN Networking Docs",
        "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_web_server",
    ),
    "security": ("OWASP Top Ten", "https://owasp.org/www-project-top-ten/"),
}

# Longest-first so "spring boot" beats "spring".
_DOC_KEYS = sorted(_DOC_MAP.keys(), key=len, reverse=True)


def find_documentation(topic: str) -> RoadmapResource | None:
    """Returns a real, curated documentation resource for a roadmap topic — or None rather than guessing a link."""
    normalized = topic.strip().lower()
    key = next((k for k in _DOC_KEYS if k in normalized), None)
    if not key:
        return None
    title, url = _DOC_MAP[key]
    return RoadmapResource(title=title, type="documentation", url=url)
