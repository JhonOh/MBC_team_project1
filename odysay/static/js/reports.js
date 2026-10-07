window.submitContentReport = async function (button, kind, contentId) {
    if (button.disabled) return;
    const reason = window.prompt('신고 사유를 입력해 주세요. (1~500자)');
    if (reason === null) return;
    if (!reason.trim() || reason.trim().length > 500) {
        alert('신고 사유를 1~500자로 입력해 주세요.');
        return;
    }
    button.disabled = true;
    let saved = false;
    try {
        const response = await fetch(`/api/reports/${kind}/${contentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({reason: reason.trim()})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.message || data.error || '신고 접수에 실패했습니다. 다시 시도해 주세요.');
        }
        saved = true;
        button.textContent = '🚨 신고 완료';
        alert(data.message);
    } catch (error) {
        alert(error.message || '신고 접수에 실패했습니다.');
    } finally {
        button.disabled = saved;
    }
};
