// Helper function to create YourHour-style timeline
function createYourHourTimeline(sessions) {
    // Group sessions by hour
    const hourlyGroups = {};
    sessions.forEach(session => {
        const hour = new Date(session.start_time).getHours();
        if (!hourlyGroups[hour]) hourlyGroups[hour] = [];
        hourlyGroups[hour].push(session);
    });

    let html = '<div style="position: relative; padding-left: 80px;">';
    let lastHour = -1;

    // Create timeline with hourly groups
    for (let hour = 0; hour < 24; hour++) {
        const sessions = hourlyGroups[hour];

        if (sessions && sessions.length > 0) {
            const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const hourTime = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;

            // Show idle time if there's a gap
            if (lastHour >= 0 && hour - lastHour > 1) {
                const idleStart = lastHour + 1;
                const idleTime = idleStart === 0 ? '12:00 AM' : idleStart < 12 ? `${idleStart}:00 AM` : idleStart === 12 ? '12:00 PM' : `${idleStart - 12}:00 PM`;
                html += `
          <div style="position: relative; margin: 16px 0; padding: 20px; background: linear-gradient(135deg, #e0f7fa, #b2ebf2); border-radius: 12px; border-left: 3px solid #00bcd4;">
            <div style="position: absolute; left: -80px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #546e7a; width: 70px; text-align: right; font-weight: 500;">
              ${idleTime}
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 40px;">😊</div>
              <div>
                <div style="font-weight: 600; color: #00897b; font-size: 16px;">Happy Hour</div>
                <div style="font-size: 13px; color: #546e7a;">Idle Time</div>
              </div>
            </div>
          </div>
        `;
            }

            // Show hourly group
            html += `
        <div style="position: relative; margin: 24px 0;">
          <div style="position: absolute; left: -80px; top: 12px; font-size: 13px; color: #546e7a; width: 70px; text-align: right; font-weight: 500;">
            ${hourTime}
          </div>
          <div style="position: absolute; left: -14px; top: 16px; width: 14px; height: 14px; background: #00bfa5; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #00bfa5; z-index: 2;"></div>
          <div style="border-left: 3px solid #00bfa5; padding-left: 24px; padding-bottom: 12px; min-height: 50px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              ${sessions.slice(0, 6).map(s => `
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00bfa5, #00897b); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 6px rgba(0,191,165,0.3);">
                  ${getAppEmoji(s.app_name)}
                </div>
              `).join('')}
              ${sessions.length > 6 ? `
                <div style="padding: 4px 12px; background: #e1e8ed; border-radius: 12px; font-size: 12px; color: #546e7a; font-weight: 500;">
                  +${sessions.length - 6}
                </div>
              ` : ''}
              <div style="margin-left: auto; font-size: 15px; font-weight: 600; color: #2c3e50;">
                ${formatDuration(totalDuration)}
              </div>
            </div>
          </div>
        </div>
      `;

            lastHour = hour;
        }
    }

    html += '</div>';
    return html;
}
