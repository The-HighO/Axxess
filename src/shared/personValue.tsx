import { Avatar } from "../components";
import { CURRENT_USER_ID, type Person } from "../data/directory";

/** A DetailList value for a person: 20px avatar, name, and "(You)" for the current user. */
export function personValue(person: Person) {
  return {
    leading: <Avatar size={20} name={person.name} color={person.color} />,
    value: person.name + (person.id === CURRENT_USER_ID ? " (You)" : ""),
  };
}
