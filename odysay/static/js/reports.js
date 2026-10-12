const reportText = (key) => window.OdysayLanguage?.t?.(key) || key;
window.submitContentReport = async function (button, kind, contentId) {
    if (button.disabled) return;
    const reason = window.prompt(reportText('report.reasonPrompt'));
    if (reason === null) return;
    if (!reason.trim() || reason.trim().length > 500) {
        alert(reportText('report.reasonRequired'));
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
            throw new Error(reportText('report.submitError'));
        }
        saved = true;
        button.textContent = reportText('report.completed');
        alert(reportText('report.success'));
    } catch (error) {
        alert(error.message || reportText('report.submitError'));
    } finally {
        button.disabled = saved;
    }
};
