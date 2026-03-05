import { Session, User } from "@supabase/supabase-js";
import React, { createContext, ReactNode, useEffect, useMemo, useState, } from "react";
import { supabase } from "../../lib/supabase";
type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
};
const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
});
export const AuthProvider = ({ children }: {
    children: ReactNode;
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const initialize = async () => {
            const { data: { session }, } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };
        initialize();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });
        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);
    const value = useMemo(() => ({ user, session, loading }), [user, session, loading]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;
