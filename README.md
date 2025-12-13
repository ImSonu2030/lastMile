# LastMile

LastMile is a scalable, fault-tolerant ride-sharing platform designed to solve the transportation challenge by connecting commuters at metro stations with nearby drivers in real-time using a microservices architecture orchestrated by Kubernetes.

### Architecture
- **Frontend Service**: A React-based SPA that serves the UI for both Riders and Drivers.

- **User Service**: Handles user registration, authentication, and role management (Rider/Driver).

- **Driver Service**: Manages driver availability and broadcasts real-time location updates via WebSockets.

- **Station Service**: Manages metadata for metro stations and locations.

- **Maching Service**: Executes the logic to find the nearest driver for a ride request.

All services communicate via REST APIs, with the Nginx Ingress Controller acting as the API Gateway.

### Key Features
- **Real-Time Tracking**: Live driver location updates using WebSockets for low-latency tracking on an interactive map.

- **Proximity-Based Matching**: efficient algorithms to instantly match riders with the nearest available driver.

- **Microservices Architecture**: Decoupled services for Users, Drivers, Stations, and Matching, ensuring independent scalability and maintenance.

- **High Availability**: Deployed on Kubernetes with multiple replicas per service to ensure zero downtime and self-healing capabilities.

- **Cloud-Native & CI/CD**: Fully containerized with Docker and automated deployment pipelines using Jenkins.

---
### Getting Started
1. **Prerequisites**: To get the project running locally, you'll need to have these installed into your system
    - Docker
    - Minikube
    - kubectl
    - Supabase account
2. **Installation & Deployment**
    - Clone the Repository
        ```bash
        git clone https://github.com/imsonu2030/lastmile.git
        cd lastmile
        ```
    - Configure Secrets: 
        <br>
        Create a kubernetes/lastmile-secrets.yml file to store your Supabase credentials. You can use the provided template or create one with the following structure:
        ```YAML
        apiVersion: v1
        kind: Secret
        metadata:
            name: lastmile-secrets
            namespace: lastmile
        type: Opaque
        stringData:
            supabase_url: "YOUR_SUPABASE_URL"
            supabase_key: "YOUR_SUPABASE_KEY"
        ```
    - Run the deployment script:
        ```bash
        chmod +x start_service.sh
        ./start_service.sh
        ```
        This script checks for Minikube status, applies the namespace, secrets, deployments, and services, and updates your `/etc/hosts` file for local domain resolution.

Once the services are running, you can access the frontend at `http://lastmile.local`

### Usage
To test locally, access the app at `http://lastmile.local`. Open two browser windows (one Incognito) after that log in as a Driver in one and as a Rider in the other window then follow these steps,
1. **Register/Login**: 
    - Create an account as a Rider or Driver and log in. 
    - You'll receive a confirmation mail from Supabase. Just click on that to verify the your mail ID.
2.  **For Drivers**:
    - Go Online: Click "Go Online" on the dashboard to become available.
    - Auto-Match: When matched, you will receive a notification and automatically "drive" to the pickup station on the map.
3. **For Riders**:
    - Request Ride: Select a Metro Station on the map, enter your destination, and click "Request Ride".
    - Track: Watch the assigned driver move toward your location in real-time.


## Technology Stack
| Category         | Technologies                                   |
|------------------|------------------------------------------------|
| Frontend         | React.js, Tailwind CSS, Vite                   |
| Backend          | Python (FastAPI), WebSockets                   |
| Database         | Supabase (PostgreSQL)                          |
| Orchestration    | Kubernetes (Minikube), Nginx Ingress Controller|
| Containerization | Docker                                         |
| CI/CD            | Jenkins                                        |

<p align="left">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="30" alt="React" title="React" style="margin-right: 10px;" />
  <img src="https://vitejs.dev/logo.svg" width="30" alt="Vite" title="Vite" style="margin-right: 10px;"/>
  <img src="https://tailwindcss.com/_next/static/media/tailwindcss-mark.d52e9897.svg" width="30" alt="Tailwind CSS" title="Tailswind css" style="margin-right: 10px;"/>
  <img src="https://img.icons8.com/?size=30&id=13441&format=png&color=000000" alt="Python" title="Python" style="margin-right: 10px;"/>
  <img src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" width="100" alt="fastAPI" title="fastAPI" style="margin-right: 10px;"/>
  <img src="https://img.icons8.com/?size=30&id=cvzmaEA4kC0o&format=png&color=000000" alt="Kubernetes" title="Kubernetes" style="margin-right: 10px;"/>
  <img src="https://img.icons8.com/?size=30&id=TkG10j-DmXkU&format=png&color=000000" alt="Docker" title="Docker" style="margin-right: 10px;"/>
  <img src="https://img.icons8.com/?size=30&id=dqxpEvJOf55J&format=png&color=000000" alt="Jenkins" title="Jenkins" style="margin-right: 10px;"/>
  <img src="https://www.postgresql.org/media/img/about/press/elephant.png" width="30" alt="PostgreSQL" title="PostgreSQL" style="margin-right: 10px;"/>
</p>