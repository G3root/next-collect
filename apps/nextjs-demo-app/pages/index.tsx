import { EventCollectionProvider } from "next-collect/client"
import { useContext, useState } from "react"
import { useCollector } from "next-collect/client"
import { GetServerSideProps } from "next"
import Head from "next/head"
import { parseUserCookie } from "../next-collect.config"
import Link from "next/link"

const ClickMe: React.FC<{}> = () => {
  const collect = useCollector()
  return <button onClick={() => collect.event("button_click", { buttonId: "Click Me" })}>ClickMe</button>
}

function addDays(days: number, date?: Date): Date {
  return new Date((date || new Date()).getTime() + days * 24 * 60 * 60 * 1000)
}

function UserId(props: { user: { id?: string; email?: string } }) {
  const [email, setEmail] = useState<string | null>(props?.user?.email || null)
  const [id, setId] = useState<string | null>(props?.user?.id || null)
  const [saved, setSaved] = useState(false)
  return (
    <>
      <h2 className="text-2xl">User identification</h2>
      <p>Set user email and user id.</p>
      <h3 key="emailHead" className="text-xl font-bold my-2">
        User email
      </h3>
      <input
        key="email"
        value={email || ""}
        onChange={e => setEmail(e.target.value.trim().length > 0 ? e.target.value.trim() : null)}
      />
      <h3 key="userHead" className="text-xl font-bold my-2">
        User id
      </h3>
      <input
        key="id"
        value={id || ""}
        onChange={e => setId(e.target.value.trim().length > 0 ? e.target.value.trim() : null)}
      />
      <div className="my-2">
        <button
          onClick={() => {
            const user = { id: id || undefined, email: email || undefined }
            document.cookie = `user=${btoa(JSON.stringify(user))}; expires=${addDays(10).toUTCString()}; path=/`
            setSaved(true)
            setTimeout(() => {
              setSaved(false)
            }, 2000)
          }}
        >
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
    </>
  )
}

const IndexPage: React.FC<any> = props => {
  return (
    <div className="flex justify-center">
      <Head>
        <title>next-collect demo app</title>
      </Head>
      <div className="p-6" style={{ maxWidth: "120rem", minWidth: "60rem" }}>
        <h1 className="text-3xl">next-collect demo app</h1>
        <div>
          <p>
            Click this button to send a <code>button_click</code> event to backend
          </p>
          <ClickMe />
        </div>
        <div className="pt-6">
          <UserId user={props.user} />
        </div>
        <div>
          <Link href="/page2">Link to other page (test prefetch)</Link>
        </div>
      </div>
    </div>
  )
}

// This gets called on every request
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  return {
    props: {
      user: parseUserCookie(req.cookies["user"]),
    },
  }
}

export default IndexPage
