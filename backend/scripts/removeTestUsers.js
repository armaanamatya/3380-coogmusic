import { getPool } from '../src/database.js';
const USERNAMES_TO_REMOVE = ['joshtest', 'artist', 'test', 'test1', 'poop'];
async function removeTestUsers() {
    if (USERNAMES_TO_REMOVE.length === 0) {
        console.log('No usernames specified for removal.');
        return;
    }
    const pool = await getPool();
    const lowerUsernames = USERNAMES_TO_REMOVE.map((name) => name.toLowerCase());
    const [users] = await pool.query('SELECT UserID, Username FROM userprofile WHERE LOWER(Username) IN (?)', [lowerUsernames]);
    if (!users || users.length === 0) {
        console.log('No matching users found for removal.');
        return;
    }
    const userIds = users.map((user) => user.UserID);
    const idPlaceholders = userIds.map(() => '?').join(', ');
    console.log(`Removing ${userIds.length} user(s): ${users.map((u) => u.Username).join(', ')}`);
    const relatedTables = [
        { table: 'user_logins', column: 'UserID' },
        { table: 'playlist', column: 'UserID' },
        { table: 'user_likes_song', column: 'UserID' },
        { table: 'user_likes_album', column: 'UserID' },
        { table: 'user_likes_playlist', column: 'UserID' },
        { table: 'user_follows_artist', column: 'UserID' },
        { table: 'user_followers', column: 'UserID' },
        { table: 'listening_history', column: 'UserID' },
        { table: 'history', column: 'UserID' }
    ];
    for (const { table, column } of relatedTables) {
        const deleteQuery = `DELETE FROM ${table} WHERE ${column} IN (${idPlaceholders})`;
        try {
            const [result] = await pool.query(deleteQuery, userIds);
            const affectedRows = result?.affectedRows ?? 0;
            if (affectedRows > 0) {
                console.log(`- Deleted ${affectedRows} row(s) from ${table}`);
            }
        }
        catch (error) {
            if (error?.code === 'ER_NO_SUCH_TABLE') {
                console.warn(`Table ${table} does not exist, skipping.`);
            }
            else {
                console.error(`Error deleting from ${table}:`, error.message || error);
            }
        }
    }
    const [result] = await pool.query(`DELETE FROM userprofile WHERE UserID IN (${idPlaceholders})`, userIds);
    const removed = result?.affectedRows ?? 0;
    console.log(`Removed ${removed} user(s) from userprofile.`);
}
removeTestUsers()
    .then(() => {
    console.log('User cleanup complete.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Failed to remove test users:', error);
    process.exit(1);
});
//# sourceMappingURL=removeTestUsers.js.map