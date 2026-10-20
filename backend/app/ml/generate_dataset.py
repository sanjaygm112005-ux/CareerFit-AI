import csv
import random

categories = [
    "Software Developer", "Data Scientist", "Data Analyst", 
    "Machine Learning Engineer", "Cybersecurity", "DevOps", 
    "Web Developer", "Java Developer", "Python Developer", "Network Engineer"
]

templates = [
    "Experienced {category} with {years} years of experience in {skill1}, {skill2}, and {skill3}. Proven track record of {action} to improve system efficiency.",
    "Passionate {category} skilled in {skill1} and {skill2}. Strong background in {concept} and {concept2}. Seeking to leverage expertise in {skill3}.",
    "Results-driven {category} with deep knowledge of {skill1}, {skill2}, and {skill3}. Led a team of {num} to successfully deploy a highly scalable architecture.",
    "Certified {category} specializing in {concept} and {concept2}. Proficient in {skill1}, {skill2}, and {skill3}. Recognized for exceptional problem-solving.",
    "Dedicated {category} with {years} years in the tech industry. Expertise includes {skill1}, {skill2}, and {skill3}. Focused on {action}.",
    "Junior {category} eager to apply theoretical knowledge in {concept} and {skill1}. Recent projects include building a full-stack app using {skill2} and {skill3}.",
    "Lead {category} with extensive experience architecting solutions using {skill1} and {skill2}. Managed critical deployments involving {concept} and {skill3}.",
    "Innovative {category} known for {action}. Expert in {skill1}, {skill2}, and {skill3}. Strong foundation in {concept}.",
    "Motivated {category} with {years} years of hands-on experience in {skill1} and {skill2}. Passionate about {concept2} and proficient in {skill3}.",
    "Accomplished {category} with a strong history of {action}. Tech stack includes {skill1}, {skill2}, and {skill3}. Skilled in {concept}."
]

skills_map = {
    "Software Developer": ["Java", "C++", "C#", "Algorithms", "Data Structures", "System Design", "Git", "Agile", "SQL", "REST API", "Microservices", "Docker"],
    "Data Scientist": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Statistics", "Pandas", "Scikit-Learn", "Data Visualization", "SQL"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Python", "Data Cleaning", "Data Visualization", "Statistical Analysis", "Business Intelligence", "Dashboarding"],
    "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "AWS SageMaker", "Docker", "Kubernetes", "MLflow", "Model Deployment", "C++", "Spark", "Airflow"],
    "Cybersecurity": ["Network Security", "Penetration Testing", "Vulnerability Assessment", "Firewalls", "Wireshark", "Kali Linux", "Incident Response", "SIEM", "Cryptography", "Ethical Hacking"],
    "DevOps": ["AWS", "Docker", "Kubernetes", "Jenkins", "CI/CD", "Terraform", "Ansible", "Linux", "Bash", "Prometheus", "Grafana", "Cloudflare"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Vue", "Angular", "TypeScript", "TailwindCSS", "Express", "MongoDB", "Redux"],
    "Java Developer": ["Java", "Spring Boot", "Hibernate", "Microservices", "REST APIs", "Maven", "Gradle", "JUnit", "Oracle DB", "Kafka", "Multithreading"],
    "Python Developer": ["Python", "Django", "Flask", "FastAPI", "PostgreSQL", "REST APIs", "Celery", "Redis", "Docker", "AWS", "Pytest", "Web Scraping"],
    "Network Engineer": ["Cisco", "Routing", "Switching", "BGP", "OSPF", "TCP/IP", "VPN", "Firewalls", "Juniper", "Network Architecture", "WAN", "LAN"]
}

concepts = ["Object-Oriented Programming", "Cloud Computing", "Database Management", "Artificial Intelligence", "Information Security", "Software Development Life Cycle", "Big Data Analytics", "Test-Driven Development", "Containerization", "Continuous Integration"]
actions = ["reducing downtime by 30%", "increasing performance by 40%", "saving the company $100k annually", "deploying critical features ahead of schedule", "optimizing database queries", "streamlining the deployment pipeline", "migrating legacy systems to the cloud", "implementing robust security protocols"]

data = []

for category in categories:
    cat_skills = skills_map[category]
    for _ in range(100):  # 100 resumes per category -> 1000 total
        template = random.choice(templates)
        s1, s2, s3 = random.sample(cat_skills, 3)
        c1, c2 = random.sample(concepts, 2)
        act = random.choice(actions)
        yrs = str(random.randint(1, 15))
        num = str(random.randint(3, 20))
        
        resume = template.format(
            category=category,
            skill1=s1, skill2=s2, skill3=s3,
            concept=c1, concept2=c2,
            action=act, years=yrs, num=num
        )
        data.append([resume, category])

# Save to CSV
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_file = os.path.join(base_dir, 'dataset', 'resumes.csv')
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['resume_text', 'category'])
    writer.writerows(data)

print(f"Successfully generated 1000 highly realistic resume samples into {csv_file}")
