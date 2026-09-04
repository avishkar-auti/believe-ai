"""Beanie ODM Documents — the write-capable persistence layer, distinct from
schemas/ (API request/response DTOs) and repositories/ (legacy read-only raw
Motor access, kept as-is for capabilities not yet ported).

Every Document here mirrors an existing Mongoose schema's collection name
and field shapes exactly (field names stay camelCase, matching Mongo/JS
convention, same as schemas/ai.py already does) — Python and Node read/write
the *same* collections side by side during the migration, never a parallel
database.
"""

from models.achievement import Achievement
from models.audit_log import AuditLog
from models.campaign import Campaign
from models.career_fit import CareerFit
from models.certification import Certification
from models.contact import Contact
from models.design_project import DesignProject
from models.design_screen import DesignScreen
from models.discussion import Discussion
from models.education import Education
from models.email_log import EmailLog
from models.experience import Experience
from models.external_api_usage import ExternalApiUsage
from models.feedback import Feedback
from models.integration import Integration
from models.interview_session import InterviewSession
from models.job import Job
from models.job_intel import JobIntel
from models.job_lead import JobLead
from models.mock_interview_room import MockInterviewRoom
from models.note import Note
from models.note_attachment import NoteAttachment
from models.note_flashcard import NoteFlashcard
from models.note_folder import NoteFolder
from models.notification import Notification
from models.outreach_draft import OutreachDraft
from models.outreach_follow_up import OutreachFollowUp
from models.outreach_send_log import OutreachSendLog
from models.portfolio_project import PortfolioProject
from models.practice_challenge import Challenge
from models.practice_progress import UserPracticeProgress
from models.practice_submission import Submission
from models.profile_image import ProfileImage
from models.resume import Resume, ResumeFile
from models.roadmap import Roadmap
from models.room_feedback import RoomFeedback
from models.room_idea import RoomIdea
from models.room_transcript_turn import RoomTranscriptTurn
from models.saved_job import SavedJob
from models.serp_lead_cache import SerpLeadCache
from models.skill import Skill
from models.template import Template
from models.unsubscribe_record import UnsubscribeRecord
from models.user import User
from models.user_context import UserContext
from models.youtube_cache import YoutubeCache

ALL_DOCUMENT_MODELS = [
    User,
    AuditLog,
    Notification,
    UserContext,
    Contact,
    DesignProject,
    DesignScreen,
    Template,
    UnsubscribeRecord,
    Campaign,
    EmailLog,
    Feedback,
    Integration,
    Discussion,
    InterviewSession,
    Job,
    SavedJob,
    JobIntel,
    OutreachDraft,
    OutreachSendLog,
    OutreachFollowUp,
    JobLead,
    SerpLeadCache,
    ExternalApiUsage,
    MockInterviewRoom,
    RoomIdea,
    RoomFeedback,
    RoomTranscriptTurn,
    CareerFit,
    Roadmap,
    Resume,
    ResumeFile,
    YoutubeCache,
    Note,
    NoteFolder,
    NoteAttachment,
    NoteFlashcard,
    Experience,
    Education,
    Skill,
    PortfolioProject,
    Certification,
    Achievement,
    ProfileImage,
    Challenge,
    Submission,
    UserPracticeProgress,
]

__all__ = [
    "ALL_DOCUMENT_MODELS",
    "Achievement",
    "AuditLog",
    "Campaign",
    "CareerFit",
    "Certification",
    "Challenge",
    "Contact",
    "DesignProject",
    "DesignScreen",
    "Discussion",
    "Education",
    "EmailLog",
    "Experience",
    "ExternalApiUsage",
    "Feedback",
    "Integration",
    "InterviewSession",
    "Job",
    "JobIntel",
    "JobLead",
    "MockInterviewRoom",
    "Note",
    "NoteAttachment",
    "NoteFlashcard",
    "NoteFolder",
    "Notification",
    "OutreachDraft",
    "OutreachFollowUp",
    "OutreachSendLog",
    "PortfolioProject",
    "ProfileImage",
    "Roadmap",
    "Resume",
    "ResumeFile",
    "RoomFeedback",
    "RoomIdea",
    "RoomTranscriptTurn",
    "SavedJob",
    "SerpLeadCache",
    "Skill",
    "Submission",
    "Template",
    "UnsubscribeRecord",
    "User",
    "UserContext",
    "UserPracticeProgress",
    "YoutubeCache",
]
