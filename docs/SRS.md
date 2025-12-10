**Software Requirements Specification (SRS)**

Project Name: DERMA (AI-Powered Dermatologist)

Version: 1.1 (Updated Framework)

Date: November 25, 2025

Prepared For: Deakin University Capstone Project

**1\. Introduction**

1.1 Purpose

The purpose of this document is to define the functional and non-functional requirements for DERMA, a web application designed to provide preliminary AI-driven classification for skin conditions2. The system utilizes Google AI Studio (Gemini) to analyze user-uploaded images and facilitates professional medical review through a dedicated Doctor Portal3.

1.2 Scope

DERMA is a containerized web application featuring a React frontend and FastAPI backend4444.

The core workflow involves:

- **Patients** uploading images of skin lesions<sup>5</sup>.  
    <br/>
- **Google Gemini API** providing a preliminary analysis and answering questions, strictly prefixed with a medical disclaimer<sup>6</sup>.  
    <br/>
- **Patients** saving case history and locating local medical help<sup>7</sup>.  
    <br/>
- **Doctors** logging in to a secure portal to review cases and schedule appointments<sup>8</sup>.  
    <br/>

**1.3 Definitions & Acronyms**

- **LLM:** Large Language Model (specifically Google Gemini 1.5 Flash/Pro)<sup>9</sup>.  
    <br/>
- **RBAC:** Role-Based Access Control (distinguishing between Patient and Doctor)<sup>10</sup>.  
    <br/>
- **POC:** Proof of Concept<sup>11</sup>.  
    <br/>
- **SRS:** Software Requirements Specification<sup>12</sup>.  
    <br/>

**2\. Overall Description**

2.1 Product Perspective

The system functions as a standalone web application deployed via Docker13. It relies on an external API (Google AI Studio) for intelligence and an internal database (Postgres/Supabase) for data persistence14.

**2.2 User Classes and Characteristics**

- **Patient (User):** Registered individuals who check skin conditions and save history<sup>15</sup>.  
    <br/>
- **Guest (Anonymous):** Unregistered users who can perform a single "Try Now" analysis but must register to save results<sup>15b</sup>.  
    <br/>
- **Doctor (Admin):** Medical professionals requiring a dashboard to view patient queues, review high-resolution images, and manage appointments<sup>16</sup>.  
    <br/>

**2.3 Operating Environment**

- **Frontend:** Web Browser (Chrome, Safari, Edge) on Desktop and Mobile<sup>17</sup>.  
    <br/>
- **Backend Host:** Docker Container (Linux-based)<sup>18</sup>.  
    <br/>
- **External Services:** Google AI Studio API (Internet connection required)<sup>19</sup>.  
    <br/>

**2.4 Design and Implementation Constraints**

- **Budget:** **Zero Budget**. Must utilize the Free Tier of Google AI Studio<sup>20</sup>.  
    <br/>
- **Medical Liability:** The system **must** display a disclaimer before any result is shown<sup>21</sup>.  
    <br/>
- **Timeline:** Must have a functional prototype by **February 2, 2026**<sup>22</sup>.  
    <br/>

**3\. Functional Requirements**

**3.1 Patient Module**

- **FR-01: Image Upload & Analysis**
- **Description:** Users can upload an image of a skin condition via the Home Page<sup>23</sup>.  
    <br/>
- **Inputs:** JPG/PNG image files (Camera capture or file selection)<sup>24</sup>.  
    <br/>
- **Processing:** The **FastAPI backend** sends the image + System Prompt to Google Gemini API<sup>25252525</sup>.  
    <br/>
- **Outputs:** A text response containing the preliminary classification. For Guests, this is ephemeral; for Patients, it is saved<sup>26</sup>.  
    <br/>
- **FR-02: Mandatory Medical Disclaimer**
- **Description:** Every AI response must be prefixed with a strict medical disclaimer<sup>27</sup>.  
    <br/>
- **Constraint:** The UI must render this disclaimer prominently before the AI analysis text is visible<sup>28</sup>.  
    <br/>
- **Sample Text:** "Disclaimer: This is an AI analysis and NOT a medical diagnosis. Please consult a professional."<sup>29</sup>.  
    <br/>
- **FR-03: Interactive Q&A Chat**
- **Description:** Users can ask follow-up questions regarding the result (e.g., "Is this contagious?")<sup>30</sup>.  
    <br/>
- **Processing:** The chat history is maintained in the session context sent to Gemini to allow for conversational continuity<sup>31</sup>.  
    <br/>
- **FR-04: User Accounts & Dashboard**
- **Description:** Guests can "Try Now" but must register/login to save case history. Registered users access the full Dashboard<sup>32</sup>.  
    <br/>
- **Functionality:**
- View past uploaded images and chat logs<sup>33</sup>.  
    <br/>
- Update personal contact details<sup>34</sup>.  
    <br/>
- **FR-05: Find Help Resources**
- **Description:** Users can access resources to find professional help<sup>35</sup>.  
    <br/>
- **Features:**
- "Find a Doctor": Uses browser geolocation to suggest nearby clinics<sup>36</sup>.  
    <br/>
- "Nurse on Call": Displays emergency/hotline contact details<sup>37</sup>.  
    <br/>

**3.2 Doctor Portal Module (Admin)**

- **FR-06: Doctor Authentication (RBAC)**
- **Description:** A secure login specifically for medical professionals<sup>38</sup>.  
    <br/>
- **Constraint:** Must be distinct from patient login permissions<sup>39</sup>.  
    <br/>
- **FR-07: Triage Dashboard**
- **Description:** Doctors view a queue of patient-submitted cases<sup>40</sup>.  
    <br/>
- **Data Displayed:** Patient Name, Submission Date, Thumbnail of Image, Status (New/Reviewed)<sup>41</sup>.  
    <br/>
- **FR-08: Clinical Review & Scheduling**
- **Description:** Doctors can open a specific case to view the high-res image and AI notes<sup>42</sup>.  
    <br/>
- **Action:** Doctors can trigger an "Appointment Request" or **Join the Chat** context directly ("One Pane of Glass" workflow) to discuss results with the patient<sup>43</sup>.  
    <br/>

**4\. Non-Functional Requirements**

**4.1 Performance**

- **Latency:** AI responses should ideally load within 5-10 seconds (dependent on Google API latency)<sup>44</sup>.  
    <br/>
- **Mobile Responsiveness:** The UI must adapt automatically to mobile screen sizes for camera usability<sup>45</sup>.  
    <br/>

**4.2 Reliability**

- **Containerization:** The application must run identically in development and production environments via Docker<sup>46</sup>.  
    <br/>

**4.3 Security & Privacy**

- **Data Storage:** Patient images and chat logs must be stored securely in the database<sup>47</sup>.  
    <br/>
- **Access Control:** Only authorized Doctor accounts can view patient uploaded data<sup>48</sup>.  
    <br/>

**5\. System Architecture & Technology Stack**

**5.1 Technology Stack**

- **Frontend:** React.js + Tailwind CSS<sup>49</sup>.  
    <br/>
- **Backend:** **FastAPI (Python)**<sup>50505050</sup>.  
    <br/>
- **AI Engine:** Google Gemini 1.5 Flash (via Google AI Studio API)<sup>51</sup>.  
    <br/>
- **Database:** Postgres (or Supabase)<sup>52</sup>.  
    <br/>
- **Deployment:** Docker & Docker Compose<sup>53</sup>.  
    <br/>

**5.2 Interface Requirements**

- **API:** The Backend will expose RESTful endpoints (e.g., /api/upload, /api/chat, /api/login)<sup>54</sup>.  
    <br/>
- **System Prompt:** A robust system prompt will be maintained in the backend to instruct Gemini on its persona (Dermatologist Assistant) and safety constraints<sup>55</sup>.  
    <br/>

**6\. Data Model (Database Schema)**

To support the Patient and Doctor workflows, the following relational database schema (Postgres/Supabase) is proposed<sup>56</sup>:

**6.1 Table: Users**

- id (Primary Key, UUID) <sup>57</sup>  
    <br/>
- email (String, Unique) <sup>58</sup>  
    <br/>
- password_hash (String, Encrypted) <sup>59</sup>  
    <br/>
- full_name (String) <sup>60</sup>  
    <br/>
- role (Enum: 'patient', 'doctor') <sup>61</sup>  
    <br/>
- created_at (Timestamp) <sup>62</sup>  
    <br/>

**6.2 Table: Cases**

- id (Primary Key, UUID) <sup>63</sup>  
    <br/>
- user_id (Foreign Key -> Users.id) <sup>64</sup>  
    <br/>
- image_url (String, Path to storage) <sup>65</sup>  
    <br/>
- ai_analysis_text (Text, The initial result from Gemini) <sup>66</sup>  
    <br/>
- chat_history (JSONB, Stores the Q&A conversation context) <sup>67</sup>  
    <br/>
- review_status (Enum: 'pending', 'reviewed', 'appointment_requested') <sup>68</sup>  
    <br/>
- reviewed_by (Foreign Key -> Users.id, Nullable) <sup>69</sup>  
    <br/>

**6.3 Table: Appointments**

- id (Primary Key, UUID) <sup>70</sup>  
    <br/>
- case_id (Foreign Key -> Cases.id) <sup>71</sup>  
    <br/>
- patient_id (Foreign Key -> Users.id) <sup>72</sup>  
    <br/>
- doctor_id (Foreign Key -> Users.id) <sup>73</sup>  
    <br/>
- requested_date (Timestamp) <sup>74</sup>  
    <br/>
- status (Enum: 'pending', 'confirmed', 'completed') <sup>75</sup>  
    <br/>

**7\. AI System Prompt & Configuration**

7.1 Persona Definition

The AI System Prompt is the core "intelligence" instruction set sent to the API. It ensures the model behaves consistently and legally 76.

System Prompt Draft:

"You are a helpful, empathetic, and professional dermatology assistant. You will be provided with an image of a skin condition. Your task is to:

- Analyze the visual characteristics of the skin condition (color, texture, shape, distribution)<sup>77</sup>.  
    <br/>
- Suggest 2-3 potential dermatological conditions that visually match these characteristics<sup>78</sup>.  
    <br/>
- **CRITICAL CONSTRAINT:** You are an AI, not a doctor<sup>79</sup>.  
    <br/>
- You **MUST** prefix your entire response with the following text exactly: 'DISCLAIMER: I am an AI assistant. This analysis is for informational purposes only and does NOT constitute a medical diagnosis. Please consult a medical professional.' <sup>80</sup>.  
    <br/>
- Answer follow-up questions based on general medical knowledge, always referring the user back to a doctor for treatment<sup>81</sup>."  
    <br/>

**8\. Future Proofing & Scalability (Plan B Strategy)**

8.1 Modular AI Architecture

To accommodate the potential switch from Google AI Studio (Plan A) to a Fine-Tuned Custom Model (Plan B), the backend architecture must enforce a strict separation of concerns82:

- **Service Interface Pattern:** The **FastAPI backend** will utilize a generic AIService interface<sup>83838383</sup>.  
    <br/>
- **Current Implementation:** GeminiService (Wraps Google API calls)<sup>84</sup>.  
    <br/>
- **Future Implementation:** CustomVisionService (Wraps calls to a local Docker container running a fine-tuned model like SkinGPT-4 or ResNet)<sup>85</sup>.  
    <br/>
- **Data Independence:** The database stores the **results** of the analysis, not the model-specific metadata, ensuring that historical user data remains valid even if the underlying AI engine is swapped<sup>86</sup>.  
    <br/>

8.2 Container Agnosticism

The application is fully containerized using Docker. This ensures that if "Plan B" is activated, the new custom model can be deployed as a separate container within the same docker-compose network without requiring changes to the React frontend or the core database logic87.