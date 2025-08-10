const BASE = 'https://localhost:5132/api/privatestatisticsuser';

export async function getMyStatisticsNumbers() {
    const res = await fetch(BASE, { credentials: 'include' });
    if (!res.ok) throw new Error('�� ������� �������� ��������� ����������');
    return res.json();
}

export async function saveMyStatisticsNumbers(patch) {
    // patch ��� �� �����, ��� � � �����������: { intake?, disputes? }
    const res = await fetch(BASE, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('�� ������� ��������� ��������� ����������');
    return res.json();
}
