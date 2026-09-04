"""Real-data routes: operate on the caller's own stored resume. Both
endpoints are ephemeral (nothing persisted here) — the web app calls these
directly, same as it does for /campaigns/{id}/insights."""

from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.ai import (
    InterviewAnswerFeedbackApiRequest,
    InterviewAnswerFeedbackResult,
    InterviewCoachApiRequest,
    InterviewCoachResult,
    InterviewQuestionsApiRequest,
    InterviewQuestionsResult,
)
from services.interview_service import answer_feedback_for_user, coach_chat_for_user, generate_questions_for_user

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/questions", response_model=InterviewQuestionsResult)
async def interview_questions_route(
    body: InterviewQuestionsApiRequest,
    settings: SettingsDep,
    db: DbDep,
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
) -> InterviewQuestionsResult:
    return await generate_questions_for_user(
        settings,
        db,
        mongo_user_id,
        body.targetRole,
        body.resumeId,
        body.interviewType,
        body.difficulty,
        body.jobTitle,
        body.jobCompany,
        body.jobDescription,
    )


@router.post("/coach", response_model=InterviewCoachResult)
async def interview_coach_route(
    body: InterviewCoachApiRequest, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> InterviewCoachResult:
    return await coach_chat_for_user(settings, db, mongo_user_id, body.message, body.history, body.resumeId)


@router.post("/answer", response_model=InterviewAnswerFeedbackResult)
async def interview_answer_route(
    body: InterviewAnswerFeedbackApiRequest,
    settings: SettingsDep,
    db: DbDep,
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
) -> InterviewAnswerFeedbackResult:
    return await answer_feedback_for_user(
        settings, db, mongo_user_id, body.question, body.category, body.answer, body.targetRole, body.resumeId
    )
