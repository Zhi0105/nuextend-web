import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


const userStore = persist(
    (set) => ({
        user: null,
        token: null,
        justVerified: false, // ✅ NEW FLAG
        setUser: (data) => set(() => ({
            user: data
        })),
        setToken: (data) => set(() => ({
            token: data
        })),
        setJustVerified: (value) => set({ justVerified: value }), // ✅ NEW SETTER
        setUserLogout: () => {
            localStorage.removeItem('user') // ❗ Clear persisted storage
            // set(() => ({ token: null, user: null, justVerified: false }))
        }
        // setUserLogout: () => set(() => ({ token: null, user: null, justVerified: false }))
    }),
    {
        name: 'user',
        storage: createJSONStorage(() => localStorage),
    })

export const useUserStore = create(userStore)