# Profile save and the stored account

After a profile save, the app stores the profile the server returned. Fields from the form that the server did not keep are not written into the account. If the photo uploads and the rest of the save fails, the app loads the profile again so the stored account matches the photo that was kept.
